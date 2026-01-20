import { JsonSchema } from '../llm';
import { Recipe } from '../../../database.types';

export interface RecipeSuggestionResult {
	selectedRecipes: string[]; // URLs of selected recipes
	reasoning: string;
	sharedIngredients: string[];
}

export const RECIPE_SUGGESTION_SCHEMA: JsonSchema = {
	type: 'object',
	properties: {
		selectedRecipes: {
			type: 'array',
			items: { type: 'string' },
		},
		reasoning: { type: 'string' },
		sharedIngredients: {
			type: 'array',
			items: { type: 'string' },
		},
	},
	required: ['selectedRecipes', 'reasoning', 'sharedIngredients'],
	additionalProperties: false,
};

export function suggestRecipesPrompt(
	recipes: Recipe[],
	userRequest: string,
	numberOfRecipes: number = 10
) {
	const recipeList = recipes
		.map((r) => {
			const ingredients = r.ingredients?.slice(0, 5).join(', ') || 'unknown';
			return `- "${r.name}" (${r.url}): ${ingredients}...`;
		})
		.join('\n');

	return {
		systemPrompt: `You are a meal planning assistant. Your job is to suggest recipes that:
1. Match the user's specific request/preferences for the week
2. Share common ingredients to reduce food waste and shopping
3. Provide variety in cuisines and cooking methods
4. Balance nutrition across the week

Available recipes and their key ingredients:
${recipeList}`,

		taskPrompt: `The user says: "${userRequest}"

Based on this request, select ${numberOfRecipes} recipes from the available list that best match their preferences while maximizing ingredient overlap.

If the user request is empty or vague, pick a balanced variety of recipes.

Return your selection as JSON:
{
  "selectedRecipes": ["url1", "url2", ...],
  "reasoning": "Brief explanation of why these recipes were chosen",
  "sharedIngredients": ["ingredient1", "ingredient2", ...]
}`,

		returnType: `Return ONLY valid JSON. Include exactly ${numberOfRecipes} recipe URLs in selectedRecipes.`,

		examples: '',
	};
}
