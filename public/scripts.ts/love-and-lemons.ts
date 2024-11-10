import axios from 'axios';
import { load } from 'cheerio';
import { uniqBy } from 'lodash';

export type Recipe = {
	name: string;
	image: string;
	rating: {
		average: number;
		count: number;
	};
	servings: string;
	prepTime: string;
	cookTime: string;
	ingredients: string[];
	instructions: string[];
	notes: string;
};

export async function getAllRecipes(allRecipeUrl: string) {
	const recipeUrls = await getRecipeLinks(allRecipeUrl);
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
		recipes.filter((recipe) => recipe !== null),
		'name'
	);
}

export async function getRecipeLinks(url: string): Promise<string[]> {
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
	return parseRecipeFromHtml(data);
}

export async function parseRecipeFromHtml(data: string): Promise<Recipe> {
	const $ = load(data);
	const recipeContainer = $('.wprm-recipe-container');

	const recipe: Recipe = {
		name: recipeContainer.find('.wprm-recipe-name').text().trim(),
		image: recipeContainer.find('.wprm-recipe-image img').attr('src') ?? '',
		rating: {
			average:
				parseFloat(
					recipeContainer.find('.wprm-recipe-rating-average').text()
				) || 0,
			count:
				parseInt(recipeContainer.find('.wprm-recipe-rating-count').text()) || 0,
		},
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
	};

	recipeContainer.find('.wprm-recipe-instruction-text').each((_, elem) => {
		recipe.instructions.push($(elem).text().trim());
	});

	recipeContainer.find('.wprm-recipe-ingredient').each((_, elem) => {
		const amount = $(elem).find('.wprm-recipe-ingredient-amount').text().trim();
		const unit = $(elem).find('.wprm-recipe-ingredient-unit').text().trim();
		const name = $(elem).find('.wprm-recipe-ingredient-name').text().trim();
		recipe.ingredients.push(`${amount} ${unit} ${name}`);
	});
	return recipe;
}
