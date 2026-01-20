import { JsonSchema } from '../llm';
import { Recipe } from '../../../database.types';

export interface DietaryClassificationResult {
	dietaryTags: string[];
	reasoning: string;
}

export const DIETARY_CLASSIFICATION_SCHEMA: JsonSchema = {
	type: 'object',
	properties: {
		dietaryTags: {
			type: 'array',
			items: { type: 'string' },
		},
		reasoning: { type: 'string' },
	},
	required: ['dietaryTags', 'reasoning'],
	additionalProperties: false,
};

export const DIETARY_TAG_OPTIONS = [
	// Positive tags (what the recipe IS)
	'vegetarian',
	'vegan',
	'pescatarian',
	'gluten-free',
	'dairy-free',
	'nut-free',
	'low-carb',
	'keto',
	'paleo',
	'halal',
	'kosher',
	// Exclusion tags (what the recipe DOES NOT contain)
	'no-red-meat',
	'no-pork',
	'no-shellfish',
] as const;

export type DietaryTag = (typeof DIETARY_TAG_OPTIONS)[number];

export function classifyRecipeDietPrompt(recipe: Recipe) {
	const ingredientList = recipe.ingredients?.join('\n- ') || 'No ingredients listed';

	return {
		systemPrompt: `You are a dietary classification expert. Analyze recipe ingredients to determine which dietary categories the recipe fits into.

Available dietary tags:
POSITIVE TAGS (recipe IS this):
- vegetarian: No meat, poultry, or fish (eggs and dairy OK)
- vegan: No animal products at all (no meat, dairy, eggs, honey)
- pescatarian: No meat or poultry, but fish/seafood OK
- gluten-free: No wheat, barley, rye, or gluten-containing ingredients
- dairy-free: No milk, cheese, butter, cream, or dairy products
- nut-free: No tree nuts or peanuts
- low-carb: Low in carbohydrates (minimal bread, pasta, rice, sugar)
- keto: Very low carb, high fat
- paleo: No grains, legumes, dairy, or processed foods
- halal: Permissible under Islamic dietary law
- kosher: Follows Jewish dietary laws

EXCLUSION TAGS (recipe does NOT contain):
- no-red-meat: No beef, pork, lamb (poultry and fish OK)
- no-pork: No pork products
- no-shellfish: No shrimp, crab, lobster, etc.

Be conservative - only add a tag if you are confident the recipe qualifies.
If unsure about an ingredient, err on the side of NOT adding restrictive tags.`,

		taskPrompt: `Analyze this recipe and determine which dietary tags apply:

Recipe: ${recipe.name}

Ingredients:
- ${ingredientList}

Return your analysis as JSON with this structure:
{
  "dietaryTags": ["tag1", "tag2", ...],
  "reasoning": "Brief explanation of classification"
}

Only include tags that definitely apply. Be conservative.`,

		returnType: `Return ONLY valid JSON. Do not include any text before or after the JSON.
Example response:
{
  "dietaryTags": ["vegetarian", "gluten-free", "no-red-meat"],
  "reasoning": "Recipe contains eggs and cheese but no meat. Uses rice flour instead of wheat."
}`,

		examples: '',
	};
}
