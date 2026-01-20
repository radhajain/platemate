import { Recipe } from '../../../database.types';
import { createSupabaseClient } from '../supabase/genericServer';
import { LoveAndLemons } from './love-and-lemons';
import { NYTCooking } from './nyt-cooking';

interface ScrapingService {
	fetchAllRecipes: () => Promise<readonly Recipe[]>;
	uploadRecipesToDatabase: (recipes: readonly Recipe[]) => Promise<void>;
	scrapeRecipeFromUrl: (url: string) => Promise<Recipe | null>;
}

/**
 * Determine which scraper to use based on the URL
 */
function getScraperForUrl(url: string): 'nyt' | 'loveandlemons' | 'unknown' {
	const hostname = new URL(url).hostname.toLowerCase();
	if (
		hostname.includes('cooking.nytimes.com') ||
		hostname.includes('nytimes.com/recipes')
	) {
		return 'nyt';
	}
	if (hostname.includes('loveandlemons.com')) {
		return 'loveandlemons';
	}
	return 'unknown';
}

export const scrapingService: ScrapingService = {
	fetchAllRecipes: async (): Promise<readonly Recipe[]> => {
		try {
			return await LoveAndLemons.getAllRecipes();
		} catch (error) {
			console.error('Error fetching recipes:', error);
			throw error;
		}
	},

	uploadRecipesToDatabase: async (recipes: readonly Recipe[]) => {
		const supabase = await createSupabaseClient();
		const { error } = await supabase
			.from('recipes')
			.upsert(recipes, { onConflict: 'url', ignoreDuplicates: true });
		if (error) {
			console.error('Error inserting data:', error);
		} else {
			console.log('Data inserted successfully');
		}
	},

	/**
	 * Scrape a single recipe from a URL
	 * Automatically detects which scraper to use based on the URL
	 */
	scrapeRecipeFromUrl: async (url: string): Promise<Recipe | null> => {
		try {
			const scraperType = getScraperForUrl(url);

			switch (scraperType) {
				case 'nyt':
					return await NYTCooking.scrapeRecipe(url);
				case 'loveandlemons': {
					// For Love and Lemons, we need to scrape and return
					const { data } = await (await import('axios')).default.get(url);
					const recipe = await LoveAndLemons.parseRecipeFromHtml(data);
					return { ...recipe, url } as Recipe;
				}
				default:
					console.warn(`No scraper available for URL: ${url}`);
					return null;
			}
		} catch (error) {
			console.error(`Error scraping recipe from ${url}:`, error);
			return null;
		}
	},
};
