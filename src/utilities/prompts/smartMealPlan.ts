import { JsonSchema } from '../llm';
import { Recipe } from '../../../database.types';

export interface SmartMealPlanResult {
	selectedRecipes: string[]; // Recipe URLs
	reasoning: string;
	sharedIngredients: string[];
}

export const SMART_MEAL_PLAN_SCHEMA: JsonSchema = {
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

export function smartMealPlanPrompt(
	recipes: readonly Recipe[],
	numberOfMeals: number = 5
) {
	const recipeList = recipes
		.map((r) => {
			const ingredients = r.ingredients?.join(', ') || 'No ingredients listed';
			return `- "${r.name}" (URL: ${r.url})\n  Ingredients: ${ingredients}`;
		})
		.join('\n\n');

	return {
		systemPrompt: `You are a smart meal planning assistant focused on reducing food waste. Your job is to select recipes that share common ingredients so the user can buy items once and use them across multiple meals.

When selecting recipes, prioritize:
1. INGREDIENT OVERLAP: Choose recipes that use the same fresh produce, proteins, and perishables
2. VARIETY: Ensure meals are diverse enough to be interesting
3. PRACTICALITY: Balance quick weeknight meals with more involved dishes

Focus especially on maximizing the use of:
- Fresh vegetables (onions, garlic, tomatoes, leafy greens)
- Fresh herbs (cilantro, parsley, basil)
- Proteins (chicken, tofu, etc.)
- Dairy products that spoil quickly`,

		returnType: `Return your response as valid JSON with this exact structure:
{
  "selectedRecipes": ["url1", "url2", ...],
  "reasoning": "Brief explanation of why these recipes were chosen together",
  "sharedIngredients": ["ingredient1", "ingredient2", ...]
}

IMPORTANT: The "selectedRecipes" array must contain exactly ${numberOfMeals} recipe URLs from the provided list.`,

		examples: '',

		taskPrompt: `From the following ${recipes.length} recipes, select exactly ${numberOfMeals} that will minimize food waste by sharing ingredients:

${recipeList}

Select ${numberOfMeals} recipes that share the most ingredients to reduce waste.`,
	};
}
