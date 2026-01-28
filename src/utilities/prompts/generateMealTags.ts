import { JsonSchema } from '../llm';
import { Recipe } from '../../../database.types';

export const MEAL_TAG_OPTIONS = [
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

export type MealTag = (typeof MEAL_TAG_OPTIONS)[number];

export interface MealTagResult {
	tags: string[];
}

export const MEAL_TAG_SCHEMA: JsonSchema = {
	type: 'object',
	properties: {
		tags: {
			type: 'array',
			items: { type: 'string' },
		},
	},
	required: ['tags'],
	additionalProperties: false,
};

export function generateMealTagsPrompt(recipe: Recipe) {
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
