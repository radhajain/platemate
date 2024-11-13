import { Recipe } from '../../../database.types';
import { Prompt } from './prompt';

export function filterRecipesPrompt(
	preferences: string,
	recipes: readonly Recipe[]
): Prompt {
	const systemPrompt = `Out of the given recipes, which recipes would the user like based on their dietary preferences?`;
	const returnType = `Return a list of the recipes' names.`;
	const examples = `
        Examples:
        
        Dietary preference: low-carb, vegetarian
        Recipes: [Chicken curry, Shakshuka, Zucchini pasta, Stuffed shells]

        Output: "[Shakshuka, Zucchini pasta]"
        ---
        Dietary preference: high protein, love dairy
        Recipes: [Chicken curry, Shakshuka, Zucchini pasta, Stuffed shells]

        Output: "[Chicken curry, Shakshuka]"
        ---

    `;
	const dietaryPreferences = `Dietary preferences: ${preferences}`;
	const recipeList = `Recipes: [${recipes.map((recipe) => {
		// return `${recipe.name}\n${recipe.ingredients.join('\n')}`;
		return `${recipe.name}`;
	})}]`;

	return {
		systemPrompt,
		returnType,
		examples,
		taskPrompt: `${dietaryPreferences}\n${recipeList}`,
	};
}
