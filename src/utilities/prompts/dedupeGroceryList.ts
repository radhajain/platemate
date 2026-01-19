import { Recipe } from '../../../database.types';
import { Prompt } from './prompt';

export interface GroceryCategory {
	name: string;
	items: GroceryItem[];
}

export interface GroceryItem {
	name: string;
	quantity: string;
	isPerishable: boolean;
}

export interface StructuredGroceryList {
	categories: GroceryCategory[];
	tips: string[];
}

// Legacy function for backward compatibility
export function dedupeGroceryList(recipes: readonly Recipe[]): Prompt {
	const systemPrompt = `Out of the given ingredients, return a list of unique ingredients and the quantity needed to make the recipe.`;
	const returnType = `Return a list as a comma separated list of the ingredients. Do not include any other text`;
	const examples = `
        Examples:

        Ingredients: [1 tablespoon extra-virgin olive oil, 1 fennel bulb, ½ teaspoon sea salt, 2 tablespoons extra-virgin olive oil]

        Output: [3 tablespoons extra-virgin olive oil, 1 fennel bulb, ½ teaspoon sea salt]
        ---
        Ingredients: [Handful arugula, 2 teaspoons balsamic vinegar, Flaky sea salt and freshly ground black pepper, ½ teaspoon sea salt, Freshly ground black pepper]

        Output: "[Handful arugula, 2 teaspoons balsamic vinegar, 1 tablespoon sea salt, 1 tablespoon freshly ground black pepper]"
        ---

    `;
	const ingredientsData = `Ingredients: [${recipes
		.flatMap(({ ingredients }) => ingredients)
		.join(', ')}]`;

	return {
		systemPrompt,
		returnType,
		examples,
		taskPrompt: `${ingredientsData}`,
	};
}

// New structured grocery list function
export function structuredGroceryListPrompt(
	recipes: readonly Recipe[]
): Prompt {
	const ingredientsList = recipes
		.flatMap(({ ingredients }) => ingredients || [])
		.filter(Boolean);

	return {
		systemPrompt: `You are a smart grocery list organizer. Your job is to:
1. Combine duplicate ingredients and sum their quantities
2. Organize items by grocery store category/aisle
3. Mark perishable items that should be used within a few days

Categories to use:
- Produce (fruits, vegetables, fresh herbs)
- Dairy & Eggs
- Meat & Seafood
- Bakery
- Pantry (canned goods, dried pasta, rice, oils, vinegars)
- Spices & Seasonings
- Frozen
- Other`,

		returnType: `Return your response as valid JSON with this exact structure:
{
  "categories": [
    {
      "name": "Produce",
      "items": [
        { "name": "Onions", "quantity": "2 medium", "isPerishable": true },
        { "name": "Garlic", "quantity": "1 head", "isPerishable": true }
      ]
    }
  ],
  "tips": ["Use the cilantro within 3 days", "Fresh tomatoes can be stored at room temperature"]
}

Be intelligent about combining quantities (e.g., "2 tbsp + 1 tbsp olive oil" = "3 tbsp olive oil").
Mark items as perishable if they should be used within 5-7 days.`,

		examples: '',

		taskPrompt: `Organize these ingredients into a structured grocery list:

${ingredientsList.map((i) => `- ${i}`).join('\n')}

Combine duplicates, organize by category, and mark perishables.`,
	};
}
