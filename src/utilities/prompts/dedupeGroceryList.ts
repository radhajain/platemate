import { Recipe } from '../../../database.types';
import { Prompt } from './prompt';

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
