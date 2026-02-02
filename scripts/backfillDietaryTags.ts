import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load environment variables with absolute path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.development.local') });

// Meal tag options
const MEAL_TAG_OPTIONS = [
	'Quick weeknight meals',
	'Comfort food',
	'Healthy & light',
	'Meal prep friendly',
	'High protein',
	'Veggie-focused',
	'Soups & stews',
	'One-pot meals',
	'Budget-friendly',
	'Date night',
	'Family-friendly',
	'Batch cooking',
	'Under 30 minutes',
	'Slow cooker',
	'Salads & bowls',
	'Appetizers & snacks',
] as const;

type MealTag = (typeof MEAL_TAG_OPTIONS)[number];

interface MealTagResult {
	tags: string[];
}

interface Recipe {
	url: string;
	name: string | null;
	prepTime: string | null;
	cookTime: string | null;
	servings: string | null;
	ingredients: string[] | null;
	instructions: string[] | null;
	dietary_tags: string[] | null;
}

const MEAL_TAG_SCHEMA = {
	type: 'object' as const,
	properties: {
		tags: {
			type: 'array',
			items: { type: 'string' },
		},
	},
	required: ['tags'],
	additionalProperties: false,
};

function generateMealTagsPrompt(recipe: Recipe) {
	const ingredients = recipe.ingredients?.join(', ') || 'No ingredients listed';
	const instructions =
		recipe.instructions?.slice(0, 3).join(' ') || 'No instructions';

	return {
		systemPrompt: `You are a recipe categorization expert. Analyze recipes and assign relevant meal tags from a predefined list.

Available tags (choose 2-4 that best fit):
${MEAL_TAG_OPTIONS.map((tag) => `- "${tag}"`).join('\n')}

Guidelines for tagging:
- "Quick weeknight meals" or "Under 30 minutes": Total time (prep + cook) is 30 minutes or less
- "Comfort food": Hearty, warming dishes like stews, casseroles, pasta, or nostalgic recipes
- "Healthy & light": Low calorie, lots of vegetables, lean proteins
- "Meal prep friendly": Can be made ahead and stored well
- "High protein": Features significant protein sources (meat, beans, tofu, eggs)
- "Veggie-focused": Vegetables are the star, not just a side
- "Soups & stews": Liquid-based dishes
- "One-pot meals": Cooked primarily in a single pot/pan
- "Budget-friendly": Uses inexpensive, common ingredients
- "Date night": More sophisticated or special occasion worthy
- "Family-friendly": Kid-approved, not too spicy or adventurous
- "Batch cooking": Makes large quantities, freezes well
- "Slow cooker": Designed for slow cooker or can be adapted
- "Salads & bowls": Cold or warm composed salads/grain bowls
- "Appetizers & snacks": Smaller bites, starters

Be selective - only choose tags that clearly apply. Most recipes should have 2-4 tags.`,

		taskPrompt: `Analyze this recipe and assign appropriate meal tags:

Recipe: ${recipe.name}
Prep Time: ${recipe.prepTime || 'Not specified'}
Cook Time: ${recipe.cookTime || 'Not specified'}
Servings: ${recipe.servings || 'Not specified'}
Ingredients: ${ingredients}
Instructions (preview): ${instructions}

Return your analysis as JSON with:
- tags: Array of 2-4 tags from the allowed list that best describe this recipe`,
	};
}

async function generateMealTags(
	anthropic: Anthropic,
	recipe: Recipe,
): Promise<string[] | null> {
	try {
		const prompt = generateMealTagsPrompt(recipe);

		const response = await anthropic.beta.messages.create({
			model: 'claude-haiku-4-5-20251001',
			max_tokens: 1024,
			betas: ['structured-outputs-2025-11-13'],
			system: prompt.systemPrompt,
			messages: [{ role: 'user', content: prompt.taskPrompt }],
			output_format: {
				type: 'json_schema',
				schema: MEAL_TAG_SCHEMA,
			},
		});

		const textContent = response.content.find((block) => block.type === 'text');
		if (textContent?.type === 'text') {
			const result = JSON.parse(textContent.text) as MealTagResult;
			// Filter to only allowed tags
			return result.tags.filter((tag) =>
				MEAL_TAG_OPTIONS.includes(tag as MealTag),
			);
		}
		return null;
	} catch (error) {
		console.error(`Error generating tags for ${recipe.name}:`, error);
		return null;
	}
}

async function backfillDietaryTags() {
	// Validate environment variables
	const apiKey = process.env.ANTHROPIC_API_KEY;
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!apiKey) {
		console.error('Missing ANTHROPIC_API_KEY in environment');
		process.exit(1);
	}
	if (!supabaseUrl || !serviceRoleKey) {
		console.error('Missing Supabase credentials in environment');
		process.exit(1);
	}

	// Initialize clients inside the function after env is loaded
	const anthropic = new Anthropic({ apiKey });
	const supabase: SupabaseClient = createClient(supabaseUrl, serviceRoleKey);

	console.log('Starting dietary tags backfill...\n');

	// Fetch all recipes without dietary_tags (null or empty array)
	const { data: recipes, error: fetchError } = await supabase
		.from('recipes')
		.select(
			'url, name, prepTime, cookTime, servings, ingredients, instructions, dietary_tags',
		)
		.or('dietary_tags.is.null,dietary_tags.eq.{}');

	if (fetchError) {
		console.error('Error fetching recipes:', fetchError);
		process.exit(1);
	}

	if (!recipes || recipes.length === 0) {
		console.log('All recipes already have dietary tags!');
		return;
	}

	console.log(`Found ${recipes.length} recipes without dietary tags.\n`);

	let successful = 0;
	let failed = 0;

	for (let i = 0; i < recipes.length; i++) {
		const recipe = recipes[i] as Recipe;
		console.log(`[${i + 1}/${recipes.length}] Processing: ${recipe.name}`);

		const tags = await generateMealTags(anthropic, recipe);

		if (!tags || tags.length === 0) {
			console.log(`  ❌ Failed to generate tags\n`);
			failed++;
			continue;
		}

		// Update the recipe in the database
		const { error: updateError } = await supabase
			.from('recipes')
			.update({ dietary_tags: tags })
			.eq('url', recipe.url);

		if (updateError) {
			console.log(`  ❌ Failed to save tags: ${updateError.message}\n`);
			failed++;
		} else {
			console.log(`  ✅ Tags: ${tags.join(', ')}\n`);
			successful++;
		}

		// Add delay to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	console.log('\n--- Backfill Complete ---');
	console.log(`Total processed: ${recipes.length}`);
	console.log(`Successful: ${successful}`);
	console.log(`Failed: ${failed}`);
}

// Run the script
backfillDietaryTags().catch(console.error);
