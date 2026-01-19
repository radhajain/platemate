'use server';
import { llmJSON } from '@/utilities/llm';
import {
	SmartMealPlanResult,
	smartMealPlanPrompt,
} from '@/utilities/prompts/smartMealPlan';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { Recipe } from '../../../database.types';
import { createClient } from './server';

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
		// router.push(`/${user.id}`);
	}
}
