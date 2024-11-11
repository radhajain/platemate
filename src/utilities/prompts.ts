import { Recipe } from '../services/scraping/love-and-lemons';

export function createRecipePrompt(preferences: string, recipes: Recipe[]) {
	const prompt = `Out of the given recipes, which recipes would the user like based on their dietary preferences?`;
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
	return `${prompt}\n${returnType}\n${examples}\n---\n${dietaryPreferences}\n${recipeList}\n\nOutput:`;
}
