import axios from 'axios';
import { load, CheerioAPI } from 'cheerio';
import { Recipe } from '../../../database.types';

interface SchemaOrgRecipe {
	'@type': string;
	name?: string;
	image?: string | string[] | { url: string }[];
	recipeIngredient?: string[];
	recipeInstructions?:
		| string[]
		| { '@type': string; text: string }[]
		| string;
	prepTime?: string;
	cookTime?: string;
	recipeYield?: string | string[];
	aggregateRating?: {
		ratingValue?: number | string;
		ratingCount?: number | string;
	};
	description?: string;
}

export const GenericScraper = {
	scrapeRecipe,
	parseFromJsonLd,
	parseFromHtml,
};

/**
 * Scrapes a recipe from any URL that contains schema.org Recipe data
 * Falls back to common HTML patterns if no JSON-LD is found
 */
export async function scrapeRecipe(url: string): Promise<Recipe | null> {
	try {
		const { data } = await axios.get(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
			},
		});

		const $ = load(data);

		// Try JSON-LD schema.org first (most reliable)
		const jsonLdRecipe = parseFromJsonLd($);
		if (jsonLdRecipe) {
			return { ...jsonLdRecipe, url };
		}

		// Fall back to common HTML patterns
		const htmlRecipe = parseFromHtml($);
		if (htmlRecipe) {
			return { ...htmlRecipe, url };
		}

		console.warn(`Could not parse recipe from ${url}`);
		return null;
	} catch (error) {
		console.error(`Error scraping recipe from ${url}:`, error);
		return null;
	}
}

/**
 * Parse recipe from JSON-LD schema.org data
 */
function parseFromJsonLd($: CheerioAPI): Omit<Recipe, 'url'> | null {
	const scripts = $('script[type="application/ld+json"]');

	for (let i = 0; i < scripts.length; i++) {
		try {
			const scriptContent = $(scripts[i]).html();
			if (!scriptContent) continue;

			const json = JSON.parse(scriptContent);

			// Handle @graph structure (common in WordPress sites)
			const items = json['@graph'] || [json];

			for (const item of Array.isArray(items) ? items : [items]) {
				if (item['@type'] === 'Recipe' || item['@type']?.includes('Recipe')) {
					return convertSchemaToRecipe(item);
				}
			}
		} catch {
			// Continue to next script tag
		}
	}

	return null;
}

/**
 * Convert schema.org Recipe to our Recipe format
 */
function convertSchemaToRecipe(schema: SchemaOrgRecipe): Omit<Recipe, 'url'> {
	// Parse image
	let image: string | null = null;
	if (typeof schema.image === 'string') {
		image = schema.image;
	} else if (Array.isArray(schema.image)) {
		const firstImage = schema.image[0];
		image =
			typeof firstImage === 'string'
				? firstImage
				: (firstImage as { url: string })?.url || null;
	}

	// Parse instructions
	let instructions: string[] = [];
	if (Array.isArray(schema.recipeInstructions)) {
		instructions = schema.recipeInstructions.map((inst) =>
			typeof inst === 'string' ? inst : inst.text || ''
		);
	} else if (typeof schema.recipeInstructions === 'string') {
		instructions = schema.recipeInstructions.split('\n').filter(Boolean);
	}

	// Parse servings
	let servings: string | null = null;
	if (typeof schema.recipeYield === 'string') {
		servings = schema.recipeYield;
	} else if (Array.isArray(schema.recipeYield)) {
		servings = schema.recipeYield[0] || null;
	}

	// Parse time (convert ISO duration to readable format)
	const prepTime = parseDuration(schema.prepTime || '');
	const cookTime = parseDuration(schema.cookTime || '');

	return {
		name: schema.name || null,
		image,
		ingredients: schema.recipeIngredient || [],
		instructions,
		prepTime,
		cookTime,
		servings,
		ratingAvg: schema.aggregateRating?.ratingValue
			? parseFloat(String(schema.aggregateRating.ratingValue))
			: null,
		ratingCount: schema.aggregateRating?.ratingCount
			? parseInt(String(schema.aggregateRating.ratingCount))
			: null,
		notes: schema.description || null,
	};
}

/**
 * Parse ISO 8601 duration to readable format
 * e.g., "PT30M" -> "30 mins", "PT1H30M" -> "1 hr 30 mins"
 */
function parseDuration(isoDuration: string): string | null {
	if (!isoDuration) return null;

	const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return isoDuration; // Return as-is if not ISO format

	const hours = parseInt(match[1] || '0');
	const minutes = parseInt(match[2] || '0');

	const parts: string[] = [];
	if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
	if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);

	return parts.join(' ') || null;
}

/**
 * Fallback: Parse recipe from common HTML patterns
 * Supports WP Recipe Maker, Tasty Recipes, and generic patterns
 */
function parseFromHtml($: CheerioAPI): Omit<Recipe, 'url'> | null {
	// Try WP Recipe Maker (WPRM)
	const wprmContainer = $('.wprm-recipe-container');
	if (wprmContainer.length > 0) {
		return parseWPRM($, wprmContainer);
	}

	// Try Tasty Recipes
	const tastyContainer = $('.tasty-recipes');
	if (tastyContainer.length > 0) {
		return parseTastyRecipes($, tastyContainer);
	}

	// Generic fallback - try common class names
	const genericRecipe = parseGenericHtml($);
	if (genericRecipe && genericRecipe.name) {
		return genericRecipe;
	}

	return null;
}

function parseWPRM(
	$: CheerioAPI,
	container: ReturnType<CheerioAPI>
): Omit<Recipe, 'url'> {
	const ingredients: string[] = [];
	container.find('.wprm-recipe-ingredient').each((_, elem) => {
		const amount = $(elem).find('.wprm-recipe-ingredient-amount').text().trim();
		const unit = $(elem).find('.wprm-recipe-ingredient-unit').text().trim();
		const name = $(elem).find('.wprm-recipe-ingredient-name').text().trim();
		ingredients.push(`${amount} ${unit} ${name}`.trim());
	});

	const instructions: string[] = [];
	container.find('.wprm-recipe-instruction-text').each((_, elem) => {
		instructions.push($(elem).text().trim());
	});

	return {
		name: container.find('.wprm-recipe-name').text().trim() || null,
		image: container.find('.wprm-recipe-image img').attr('src') || null,
		ingredients,
		instructions,
		prepTime:
			container
				.find('.wprm-recipe-prep-time-container .wprm-recipe-prep_time')
				.text()
				.trim() || null,
		cookTime:
			container
				.find('.wprm-recipe-cook-time-container .wprm-recipe-cook_time')
				.text()
				.trim() || null,
		servings: (container.find('.wprm-recipe-servings').data('value') as string) || null,
		ratingAvg:
			parseFloat(container.find('.wprm-recipe-rating-average').text()) || null,
		ratingCount:
			parseInt(container.find('.wprm-recipe-rating-count').text()) || null,
		notes: container.find('.wprm-recipe-notes').text().trim() || null,
	};
}

function parseTastyRecipes(
	$: CheerioAPI,
	container: ReturnType<CheerioAPI>
): Omit<Recipe, 'url'> {
	const ingredients: string[] = [];
	container.find('.tasty-recipes-ingredients li').each((_, elem) => {
		ingredients.push($(elem).text().trim());
	});

	const instructions: string[] = [];
	container.find('.tasty-recipes-instructions li').each((_, elem) => {
		instructions.push($(elem).text().trim());
	});

	return {
		name: container.find('.tasty-recipes-title').text().trim() || null,
		image: container.find('.tasty-recipes-image img').attr('src') || null,
		ingredients,
		instructions,
		prepTime:
			container.find('.tasty-recipes-prep-time').text().trim() || null,
		cookTime:
			container.find('.tasty-recipes-cook-time').text().trim() || null,
		servings: container.find('.tasty-recipes-yield').text().trim() || null,
		ratingAvg: null,
		ratingCount: null,
		notes: container.find('.tasty-recipes-notes').text().trim() || null,
	};
}

function parseGenericHtml($: CheerioAPI): Omit<Recipe, 'url'> | null {
	// Try to find recipe name from common patterns
	const name =
		$('h1.recipe-title').text().trim() ||
		$('h1.entry-title').text().trim() ||
		$('h1').first().text().trim() ||
		null;

	// Find ingredients
	const ingredients: string[] = [];
	const ingredientSelectors = [
		'.recipe-ingredients li',
		'.ingredients li',
		'[itemprop="recipeIngredient"]',
		'.ingredient-list li',
	];

	for (const selector of ingredientSelectors) {
		$(selector).each((_, elem) => {
			const text = $(elem).text().trim();
			if (text) ingredients.push(text);
		});
		if (ingredients.length > 0) break;
	}

	// Find instructions
	const instructions: string[] = [];
	const instructionSelectors = [
		'.recipe-instructions li',
		'.instructions li',
		'[itemprop="recipeInstructions"]',
		'.recipe-steps li',
	];

	for (const selector of instructionSelectors) {
		$(selector).each((_, elem) => {
			const text = $(elem).text().trim();
			if (text) instructions.push(text);
		});
		if (instructions.length > 0) break;
	}

	// Find image
	const image =
		$('.recipe-image img').attr('src') ||
		$('[itemprop="image"]').attr('src') ||
		$('.entry-content img').first().attr('src') ||
		null;

	if (!name || ingredients.length === 0) {
		return null;
	}

	return {
		name,
		image,
		ingredients,
		instructions,
		prepTime: null,
		cookTime: null,
		servings: null,
		ratingAvg: null,
		ratingCount: null,
		notes: null,
	};
}
