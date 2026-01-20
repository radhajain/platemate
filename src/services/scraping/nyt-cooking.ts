import axios from 'axios';
import { load } from 'cheerio';
import { Recipe } from '../../../database.types';

export const NYTCooking = {
	scrapeRecipe,
	parseRecipeFromHtml,
};

/**
 * Scrape a single recipe from NYT Cooking given its URL
 * Note: NYT Cooking requires a subscription for most recipes,
 * so this scraper works best with the HTML content passed directly
 */
async function scrapeRecipe(url: string): Promise<Recipe> {
	const { data } = await axios.get(url, {
		headers: {
			'User-Agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		},
	});
	const recipe = parseRecipeFromHtml(data);
	return { ...recipe, url };
}

/**
 * Parse recipe data from NYT Cooking HTML
 * Based on their class naming conventions:
 * - Recipe title: h1.pantry--title-display
 * - Image: .recipeheaderimage_image__1NgvN
 * - Stats (time, rating): .stats_statsTable__1f3pU
 * - Ingredients: .ingredient_ingredient__rfjvs
 * - Instructions: .preparation_step__nzZHP
 */
function parseRecipeFromHtml(html: string): Omit<Recipe, 'url'> {
	const $ = load(html);

	// Recipe name - in h1 with class pantry--title-display
	const name = $('h1.pantry--title-display').text().trim() || null;

	// Image - look for the main recipe image
	const image =
		$('.recipeheaderimage_image__1NgvN').attr('src') ||
		$('figure img').first().attr('src') ||
		null;

	// Rating - look for the average rating
	const ratingText = $('.stats_avgRating__nell8').text().trim();
	const ratingAvg = ratingText ? parseFloat(ratingText) : null;

	// Rating count - in parentheses after stars
	const ratingCountMatch = $('.stats_ratingInfo__J5GTs')
		.text()
		.match(/\((\d+)\)/);
	const ratingCount = ratingCountMatch ? parseInt(ratingCountMatch[1]) : null;

	// Servings/Yield
	const servingsText = $('.ingredients_recipeYield__DN65p .pantry--ui')
		.text()
		.trim();
	const servings = servingsText || null;

	// Times - NYT shows Total Time, Prep Time, Cook Time
	let prepTime: string | null = null;
	let cookTime: string | null = null;

	// Find prep time
	$('.stats_cookingTimeTable__b0moV dt').each((_, elem) => {
		const label = $(elem).text().trim().toLowerCase();
		const value = $(elem).next('dd').text().trim();
		if (label.includes('prep')) {
			prepTime = value;
		} else if (label.includes('cook')) {
			cookTime = value;
		} else if (label === 'total time' && !prepTime && !cookTime) {
			// If we only have total time, use it as cook time
			cookTime = value;
		}
	});

	// Ingredients - each ingredient has quantity and text
	const ingredients: string[] = [];
	$('.ingredient_ingredient__rfjvs').each((_, elem) => {
		const quantity = $(elem).find('.ingredient_quantity__Z_Mvw').text().trim();
		// Get the rest of the ingredient text (excluding the quantity span)
		const ingredientText = $(elem)
			.contents()
			.filter(function () {
				return (
					this.type === 'text' ||
					(this.type === 'tag' &&
						!$(this).hasClass('ingredient_quantity__Z_Mvw'))
				);
			})
			.text()
			.trim();

		// Also check for span without the quantity class
		const nameSpan = $(elem)
			.find('span:not(.ingredient_quantity__Z_Mvw)')
			.text()
			.trim();

		const fullIngredient = quantity
			? `${quantity} ${nameSpan || ingredientText}`.trim()
			: (nameSpan || ingredientText).trim();

		if (fullIngredient) {
			ingredients.push(fullIngredient);
		}
	});

	// Instructions - each step has a number and content
	const instructions: string[] = [];
	$('.preparation_step__nzZHP').each((_, elem) => {
		const stepContent = $(elem)
			.find('.preparation_stepContent__CFrQM p')
			.text()
			.trim();
		if (stepContent) {
			instructions.push(stepContent);
		}
	});

	// Notes - from the top note section
	const notes =
		$('.topnote_topnoteParagraphs__A3OtF').text().trim() ||
		$('.topnote_topnote__jH8tN').text().trim() ||
		null;

	return {
		name,
		image,
		ratingAvg,
		ratingCount,
		servings,
		prepTime,
		cookTime,
		ingredients: ingredients.length > 0 ? ingredients : null,
		instructions: instructions.length > 0 ? instructions : null,
		notes,
		dietary_tags: null, // Will be classified by Claude later
	};
}
