import { Recipe } from '../../database.types';

export interface IngredientStats {
	totalUniqueIngredients: number;
	totalIngredientOccurrences: number;
	overlappingIngredients: { name: string; count: number; recipes: string[] }[];
	ingredientsByRecipe: { recipeName: string; count: number }[];
	overlapScore: number; // 0-100, higher means more overlap
	estimatedSavings: string;
}

// Normalize ingredient names for comparison
function normalizeIngredient(ingredient: string): string {
	// Extract the main ingredient name, ignoring quantities and preparation
	let normalized = ingredient
		.toLowerCase()
		// Remove common measurements and quantities
		.replace(/^\d+[\d\/\s]*/, '')
		.replace(
			/\b(cup|cups|tablespoon|tablespoons|tbsp|teaspoon|teaspoons|tsp|pound|pounds|lb|lbs|ounce|ounces|oz|gram|grams|g|kg|ml|liter|liters|bunch|bunches|clove|cloves|head|heads|piece|pieces|slice|slices|can|cans|jar|jars|package|packages|container|stick|sticks)\b/gi,
			''
		)
		// Remove preparation descriptions
		.replace(
			/\b(chopped|diced|minced|sliced|grated|shredded|crushed|ground|fresh|dried|frozen|cooked|raw|large|medium|small|optional|to taste|for garnish|about|roughly|finely|thinly|thickly)\b/gi,
			''
		)
		// Remove parenthetical content
		.replace(/\([^)]*\)/g, '')
		// Clean up whitespace and punctuation
		.replace(/[,;]/g, '')
		.trim()
		.replace(/\s+/g, ' ');

	// Map common variations to canonical names
	const aliases: Record<string, string> = {
		'olive oil': 'olive oil',
		'extra virgin olive oil': 'olive oil',
		'extra-virgin olive oil': 'olive oil',
		'vegetable oil': 'vegetable oil',
		'canola oil': 'vegetable oil',
		garlic: 'garlic',
		'garlic cloves': 'garlic',
		onion: 'onion',
		onions: 'onion',
		'yellow onion': 'onion',
		'white onion': 'onion',
		'red onion': 'red onion',
		salt: 'salt',
		'kosher salt': 'salt',
		'sea salt': 'salt',
		'table salt': 'salt',
		pepper: 'black pepper',
		'black pepper': 'black pepper',
		'ground black pepper': 'black pepper',
		'freshly ground pepper': 'black pepper',
		lemon: 'lemon',
		lemons: 'lemon',
		'lemon juice': 'lemon',
		lime: 'lime',
		limes: 'lime',
		'lime juice': 'lime',
		butter: 'butter',
		'unsalted butter': 'butter',
		'salted butter': 'butter',
		chicken: 'chicken',
		'chicken breast': 'chicken breast',
		'chicken breasts': 'chicken breast',
		'chicken thigh': 'chicken thigh',
		'chicken thighs': 'chicken thigh',
		parsley: 'parsley',
		'fresh parsley': 'parsley',
		cilantro: 'cilantro',
		'fresh cilantro': 'cilantro',
		basil: 'basil',
		'fresh basil': 'basil',
		tomato: 'tomato',
		tomatoes: 'tomato',
		'cherry tomatoes': 'cherry tomatoes',
		'grape tomatoes': 'cherry tomatoes',
		rice: 'rice',
		'white rice': 'rice',
		'brown rice': 'brown rice',
		pasta: 'pasta',
		spaghetti: 'pasta',
		penne: 'pasta',
		'parmesan cheese': 'parmesan',
		parmesan: 'parmesan',
		'parmigiano reggiano': 'parmesan',
		'grated parmesan': 'parmesan',
	};

	return aliases[normalized] || normalized;
}

export function calculateIngredientStats(recipes: Recipe[]): IngredientStats {
	if (recipes.length === 0) {
		return {
			totalUniqueIngredients: 0,
			totalIngredientOccurrences: 0,
			overlappingIngredients: [],
			ingredientsByRecipe: [],
			overlapScore: 0,
			estimatedSavings: '0%',
		};
	}

	// Track ingredients across all recipes
	const ingredientMap = new Map<
		string,
		{ count: number; recipes: Set<string>; originalNames: Set<string> }
	>();

	const ingredientsByRecipe: { recipeName: string; count: number }[] = [];

	for (const recipe of recipes) {
		const recipeIngredients = recipe.ingredients || [];
		ingredientsByRecipe.push({
			recipeName: recipe.name || 'Unknown Recipe',
			count: recipeIngredients.length,
		});

		for (const ingredient of recipeIngredients) {
			const normalized = normalizeIngredient(ingredient);
			if (normalized.length < 2) continue; // Skip very short/empty

			if (!ingredientMap.has(normalized)) {
				ingredientMap.set(normalized, {
					count: 0,
					recipes: new Set(),
					originalNames: new Set(),
				});
			}
			const entry = ingredientMap.get(normalized)!;
			entry.count++;
			entry.recipes.add(recipe.name || 'Unknown');
			entry.originalNames.add(ingredient);
		}
	}

	// Find overlapping ingredients (used in 2+ recipes)
	const overlappingIngredients = Array.from(ingredientMap.entries())
		.filter(([, data]) => data.recipes.size >= 2)
		.map(([name, data]) => ({
			name: name.charAt(0).toUpperCase() + name.slice(1),
			count: data.recipes.size,
			recipes: Array.from(data.recipes),
		}))
		.sort((a, b) => b.count - a.count);

	const totalUniqueIngredients = ingredientMap.size;
	const totalIngredientOccurrences = Array.from(ingredientMap.values()).reduce(
		(sum, data) => sum + data.count,
		0
	);

	// Calculate overlap score (0-100)
	// Higher score means more ingredients are shared across recipes
	const totalOverlappingOccurrences = overlappingIngredients.reduce(
		(sum, ing) => sum + ing.count,
		0
	);
	const maxPossibleOverlap = totalUniqueIngredients * recipes.length;
	const overlapScore =
		maxPossibleOverlap > 0
			? Math.round((totalOverlappingOccurrences / maxPossibleOverlap) * 100)
			: 0;

	// Estimate savings based on overlap
	const savingsPercent =
		totalIngredientOccurrences > 0
			? Math.round(
					((totalIngredientOccurrences - totalUniqueIngredients) /
						totalIngredientOccurrences) *
						100
				)
			: 0;

	return {
		totalUniqueIngredients,
		totalIngredientOccurrences,
		overlappingIngredients,
		ingredientsByRecipe,
		overlapScore,
		estimatedSavings: `${savingsPercent}%`,
	};
}
