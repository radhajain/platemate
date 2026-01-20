import axios from 'axios';
import { load } from 'cheerio';
import { uniqBy } from 'lodash';
import { Recipe } from '../../../database.types';

const allRecipeUrls = [
	'https://www.loveandlemons.com/easy-dinner-ideas/',
	'https://www.loveandlemons.com/rice-bowl-recipes/',
];

export const LoveAndLemons = {
	getAllRecipes,
	// For testing
	parseRecipeFromHtml,
};

async function getAllRecipes(): Promise<readonly Recipe[]> {
	const recipeUrls = (
		await Promise.all(allRecipeUrls.map(async (url) => getRecipeLinks(url)))
	).flat();
	const recipes = await Promise.all(
		recipeUrls.map(async (url) => {
			try {
				return await scrapeRecipe(url);
			} catch (error) {
				console.error(`Error fetching recipe from ${url}:`, error);
				return null;
			}
		})
	);
	return uniqBy(
		recipes.filter(
			(recipe) => recipe != null && recipe.name != null
		) as Recipe[],
		'name'
	);
}

async function getRecipeLinks(url: string): Promise<string[]> {
	const { data } = await axios.get(url);
	const $ = load(data);
	const links = new Set<string>();
	$('h4 > a').each((_, element) => {
		const link = $(element).attr('href');
		if (
			link != null &&
			link.length > 0 &&
			link.startsWith('https://www.loveandlemons.com/')
		) {
			links.add(link);
		}
	});
	return Array.from(links);
}

async function scrapeRecipe(url: string): Promise<Recipe> {
	const { data } = await axios.get(url);
	const recipe = await parseRecipeFromHtml(data);
	return { ...recipe, url };
}

async function parseRecipeFromHtml(data: string): Promise<Omit<Recipe, 'url'>> {
	const $ = load(data);
	const recipeContainer = $('.wprm-recipe-container');

	const recipe: Omit<Recipe, 'url'> = {
		name: recipeContainer.find('.wprm-recipe-name').text().trim(),
		image: recipeContainer.find('.wprm-recipe-image img').attr('src') ?? null,
		ratingAvg: parseFloat(
			recipeContainer.find('.wprm-recipe-rating-average').text()
		),
		ratingCount: parseInt(
			recipeContainer.find('.wprm-recipe-rating-count').text()
		),
		servings: recipeContainer
			.find('.wprm-recipe-servings')
			.data('value') as string,
		prepTime: recipeContainer
			.find('.wprm-recipe-prep-time-container .wprm-recipe-prep_time')
			.text()
			.trim(),
		cookTime: recipeContainer
			.find('.wprm-recipe-cook-time-container .wprm-recipe-cook_time')
			.text()
			.trim(),
		ingredients: [],
		instructions: [],
		notes: recipeContainer.find('.wprm-recipe-notes').text().trim(),
		dietary_tags: null, // Will be classified by Claude later
	};

	recipeContainer.find('.wprm-recipe-instruction-text').each((_, elem) => {
		(recipe.instructions ?? []).push($(elem).text().trim());
	});

	recipeContainer.find('.wprm-recipe-ingredient').each((_, elem) => {
		const amount = $(elem).find('.wprm-recipe-ingredient-amount').text().trim();
		const unit = $(elem).find('.wprm-recipe-ingredient-unit').text().trim();
		const name = $(elem).find('.wprm-recipe-ingredient-name').text().trim();
		(recipe.ingredients ?? []).push(`${amount} ${unit} ${name}`);
	});
	return recipe;
}
