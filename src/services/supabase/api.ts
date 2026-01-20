'use server';
import { llmJSON } from '@/utilities/llm';
import {
	SmartMealPlanResult,
	smartMealPlanPrompt,
} from '@/utilities/prompts/smartMealPlan';
import {
	RecipeSuggestionResult,
	suggestRecipesPrompt,
} from '@/utilities/prompts/suggestRecipes';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { Recipe, UserProfile } from '../../../database.types';
import { createClient } from './server';

// ==================== User Profile Functions ====================

export async function getUserProfile(
	userId: string
): Promise<UserProfile | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from('user_profiles')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			// No profile found
			return null;
		}
		console.error('Error fetching user profile:', error);
		return null;
	}

	return data;
}

export async function saveUserProfile(
	userId: string,
	profile: { firstName?: string; dietaryPreferences?: string[]; weeklyStaples?: string[] }
): Promise<UserProfile | null> {
	const supabase = await createClient();

	// Check if profile exists
	const existing = await getUserProfile(userId);

	if (existing) {
		// Update existing profile
		const { data, error } = await supabase
			.from('user_profiles')
			.update({
				first_name: profile.firstName,
				dietary_preferences: profile.dietaryPreferences,
				weekly_staples: profile.weeklyStaples,
				updated_at: new Date().toISOString(),
			})
			.eq('user_id', userId)
			.select()
			.single();

		if (error) {
			console.error('Error updating user profile:', error);
			return null;
		}
		return data;
	} else {
		// Create new profile
		const { data, error } = await supabase
			.from('user_profiles')
			.insert({
				user_id: userId,
				first_name: profile.firstName,
				dietary_preferences: profile.dietaryPreferences,
				weekly_staples: profile.weeklyStaples,
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating user profile:', error);
			return null;
		}
		return data;
	}
}

// ==================== Liked Recipes Functions ====================

export async function getUserLikedRecipeUrls(
	userId: string
): Promise<Set<string>> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from('user_liked_recipes')
		.select('recipe_url')
		.eq('user_id', userId);

	if (error) {
		console.error('Error fetching liked recipes:', error);
		return new Set();
	}

	return new Set(data.map((r) => r.recipe_url).filter(Boolean) as string[]);
}

export async function getUserLikedRecipes(userId: string): Promise<Recipe[]> {
	const supabase = await createClient();

	// Get liked recipe URLs
	const likedUrls = await getUserLikedRecipeUrls(userId);
	if (likedUrls.size === 0) return [];

	// Get full recipe objects
	const { data: recipes, error } = await supabase
		.from('recipes')
		.select('*')
		.in('url', Array.from(likedUrls));

	if (error) {
		console.error('Error fetching liked recipes:', error);
		return [];
	}

	return recipes || [];
}

export async function toggleLikedRecipe(
	userId: string,
	recipeUrl: string
): Promise<boolean> {
	const supabase = await createClient();

	// Check if already liked
	const { data: existing } = await supabase
		.from('user_liked_recipes')
		.select('id')
		.eq('user_id', userId)
		.eq('recipe_url', recipeUrl)
		.single();

	if (existing) {
		// Unlike - remove from table
		const { error } = await supabase
			.from('user_liked_recipes')
			.delete()
			.eq('user_id', userId)
			.eq('recipe_url', recipeUrl);

		if (error) {
			console.error('Error unliking recipe:', error);
			return false;
		}
		return false; // Return false to indicate now unliked
	} else {
		// Like - add to table
		const { error } = await supabase.from('user_liked_recipes').insert({
			user_id: userId,
			recipe_url: recipeUrl,
		});

		if (error) {
			console.error('Error liking recipe:', error);
			return true; // Return previous state on error
		}
		return true; // Return true to indicate now liked
	}
}

// ==================== Recipe Filtering Functions ====================

export async function getFilteredRecipes(
	userId: string
): Promise<Recipe[]> {
	const supabase = await createClient();

	// Get user's dietary preferences
	const profile = await getUserProfile(userId);
	const preferences = profile?.dietary_preferences || [];

	// Get all recipes
	const { data: recipes, error } = await supabase
		.from('recipes')
		.select('*')
		.order('name');

	if (error) {
		console.error('Error fetching recipes:', error);
		return [];
	}

	if (!recipes) return [];

	// If no preferences, return all recipes
	if (preferences.length === 0) {
		return recipes;
	}

	// Filter recipes based on dietary tags
	// A recipe matches if it has ALL the user's dietary preferences as tags
	// OR if dietary_tags is null (not yet classified)
	return recipes.filter((recipe) => {
		if (!recipe.dietary_tags || recipe.dietary_tags.length === 0) {
			// Include unclassified recipes for now
			return true;
		}

		// Check if recipe matches user preferences
		// For "exclusion" preferences (no-red-meat, vegetarian, etc.),
		// the recipe's dietary_tags should include them
		return preferences.every((pref) => recipe.dietary_tags?.includes(pref));
	});
}

export async function generateWeeklyRecipes(
	userId: User['id'],
	weekStartDate: Date,
	supabase: SupabaseClient,
	numberOfMeals: number = 5
) {
	// Get user's liked recipes with full recipe data
	const { data: likedRecipeData, error } = await supabase
		.from('user_liked_recipes')
		.select('recipe_url, recipes(*)');

	if (error) {
		console.error('Error getting data:', error);
		return;
	}

	// Extract full recipe objects
	const recipes = likedRecipeData
		.map((lr) => lr.recipes as unknown as Recipe)
		.filter((r): r is Recipe => r !== null && r !== undefined);

	if (recipes.length === 0) {
		console.error('No liked recipes found');
		return;
	}

	let selectedUrls: string[];

	// Use Claude to select recipes intelligently if we have enough recipes
	if (recipes.length >= numberOfMeals) {
		const prompt = smartMealPlanPrompt(recipes, numberOfMeals);
		const result = await llmJSON<SmartMealPlanResult>(prompt);

		if (result && result.selectedRecipes.length > 0) {
			selectedUrls = result.selectedRecipes;
			console.log('Smart meal plan reasoning:', result.reasoning);
			console.log('Shared ingredients:', result.sharedIngredients);
		} else {
			// Fallback to random selection if Claude fails
			console.log('Falling back to random selection');
			selectedUrls = selectRandomRecipes(recipes, numberOfMeals);
		}
	} else {
		// If not enough recipes, use all of them
		selectedUrls = recipes.map((r) => r.url);
	}

	// Clear existing recipes for this week
	await supabase
		.from('weekly_user_recipes')
		.delete()
		.eq('user_id', userId)
		.eq('week_start_date', weekStartDate.toISOString());

	// Insert new weekly recipes
	const { data, error: insertError } = await supabase
		.from('weekly_user_recipes')
		.insert(
			selectedUrls.map((url) => ({
				user_id: userId,
				recipe_url: url,
				week_start_date: weekStartDate,
			}))
		)
		.select('*');

	if (insertError) {
		console.error('Error inserting weekly recipes:', insertError);
	} else {
		console.log('Weekly meal plan generated successfully');
	}

	return data;
}

function selectRandomRecipes(recipes: Recipe[], count: number): string[] {
	const shuffled = [...recipes].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count).map((r) => r.url);
}

export async function saveUserLikedRecipes(
	user: User,
	likedRecipeUrls: Set<string>
) {
	const supabase = await createClient();
	const { error } = await supabase.from('user_liked_recipes').insert(
		Array.from(likedRecipeUrls).map((url) => ({
			user_id: user.id,
			recipe_url: url,
		}))
	);
	if (error) {
		console.error('Error inserting data:', error);
	} else {
		console.log('Data inserted successfully');
	}
}

// ==================== Meal Plan Functions ====================

export async function getWeeklyRecipes(
	userId: string,
	weekStartDate: Date
): Promise<Recipe[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from('weekly_user_recipes')
		.select('recipe_url, recipes(*)')
		.eq('user_id', userId)
		.eq('week_start_date', weekStartDate.toISOString());

	if (error) {
		console.error('Error fetching weekly recipes:', error);
		return [];
	}

	return data
		.map((item) => item.recipes as unknown as Recipe)
		.filter((r): r is Recipe => r !== null);
}

export async function removeRecipeFromWeeklyPlan(
	userId: string,
	recipeUrl: string,
	weekStartDate: Date
): Promise<boolean> {
	const supabase = await createClient();
	const { error } = await supabase
		.from('weekly_user_recipes')
		.delete()
		.eq('user_id', userId)
		.eq('recipe_url', recipeUrl)
		.eq('week_start_date', weekStartDate.toISOString());

	if (error) {
		console.error('Error removing recipe from weekly plan:', error);
		return false;
	}
	return true;
}

export async function addRecipeToWeeklyPlan(
	userId: string,
	recipeUrl: string,
	weekStartDate: Date
): Promise<boolean> {
	const supabase = await createClient();
	const { error } = await supabase.from('weekly_user_recipes').insert({
		user_id: userId,
		recipe_url: recipeUrl,
		week_start_date: weekStartDate.toISOString(),
	});

	if (error) {
		console.error('Error adding recipe to weekly plan:', error);
		return false;
	}
	return true;
}

export async function getSuggestedRecipes(
	userId: string,
	userRequest: string,
	numberOfRecipes: number = 10
): Promise<{ recipes: Recipe[]; reasoning: string; sharedIngredients: string[] } | null> {
	const supabase = await createClient();

	// Get user's liked recipes
	const { data: likedRecipeData, error } = await supabase
		.from('user_liked_recipes')
		.select('recipe_url, recipes(*)')
		.eq('user_id', userId);

	if (error) {
		console.error('Error getting liked recipes:', error);
		return null;
	}

	const recipes = likedRecipeData
		.map((lr) => lr.recipes as unknown as Recipe)
		.filter((r): r is Recipe => r !== null && r !== undefined);

	if (recipes.length === 0) {
		return { recipes: [], reasoning: 'No liked recipes found', sharedIngredients: [] };
	}

	// Use Claude to suggest recipes
	const prompt = suggestRecipesPrompt(recipes, userRequest, numberOfRecipes);
	const result = await llmJSON<RecipeSuggestionResult>(prompt);

	if (!result) {
		// Fallback to random selection
		const shuffled = [...recipes].sort(() => 0.5 - Math.random());
		return {
			recipes: shuffled.slice(0, numberOfRecipes),
			reasoning: 'Random selection (AI suggestion unavailable)',
			sharedIngredients: [],
		};
	}

	// Get full recipe objects for selected URLs
	const selectedRecipes = result.selectedRecipes
		.map((url) => recipes.find((r) => r.url === url))
		.filter((r): r is Recipe => r !== undefined);

	return {
		recipes: selectedRecipes,
		reasoning: result.reasoning,
		sharedIngredients: result.sharedIngredients,
	};
}

export async function saveWeeklyPlan(
	userId: string,
	recipeUrls: string[],
	weekStartDate: Date
): Promise<boolean> {
	const supabase = await createClient();

	// Clear existing recipes for this week
	await supabase
		.from('weekly_user_recipes')
		.delete()
		.eq('user_id', userId)
		.eq('week_start_date', weekStartDate.toISOString());

	// Insert selected recipes
	const { error } = await supabase.from('weekly_user_recipes').insert(
		recipeUrls.map((url) => ({
			user_id: userId,
			recipe_url: url,
			week_start_date: weekStartDate.toISOString(),
		}))
	);

	if (error) {
		console.error('Error saving weekly plan:', error);
		return false;
	}
	return true;
}
