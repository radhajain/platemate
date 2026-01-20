'use server';

import { scrapingService } from '@/services/scraping/scrapingService';
import { Recipe } from '../../../../database.types';

export interface ScrapeResult {
	url: string;
	success: boolean;
	recipe?: Recipe;
	error?: string;
}

/**
 * Check if a URL is from a supported website
 */
function isSupportedUrl(url: string): boolean {
	try {
		const hostname = new URL(url).hostname.toLowerCase();
		return (
			hostname.includes('cooking.nytimes.com') ||
			hostname.includes('nytimes.com/recipes') ||
			hostname.includes('loveandlemons.com')
		);
	} catch {
		return false;
	}
}

/**
 * Scrape a single recipe from a URL
 */
export async function scrapeRecipeFromUrl(url: string): Promise<ScrapeResult> {
	const trimmedUrl = url.trim();

	if (!trimmedUrl) {
		return { url: trimmedUrl, success: false, error: 'URL is empty' };
	}

	// Validate URL format
	try {
		new URL(trimmedUrl);
	} catch {
		return { url: trimmedUrl, success: false, error: 'Invalid URL format' };
	}

	// Check if website is supported
	if (!isSupportedUrl(trimmedUrl)) {
		return {
			url: trimmedUrl,
			success: false,
			error:
				'Website not supported. Currently we support Love and Lemons and NYT Cooking recipes. Try adding this recipe manually instead.',
		};
	}

	try {
		const recipe = await scrapingService.scrapeRecipeFromUrl(trimmedUrl);
		if (!recipe) {
			return {
				url: trimmedUrl,
				success: false,
				error: 'Failed to parse recipe from this URL',
			};
		}
		return { url: trimmedUrl, success: true, recipe };
	} catch (error) {
		console.error(`Error scraping ${trimmedUrl}:`, error);
		return {
			url: trimmedUrl,
			success: false,
			error: 'Failed to fetch recipe. The page may be unavailable or require login.',
		};
	}
}

/**
 * Scrape multiple recipes from a list of URLs
 */
export async function scrapeRecipesFromUrls(
	urls: string[]
): Promise<ScrapeResult[]> {
	const results = await Promise.all(
		urls.map((url) => scrapeRecipeFromUrl(url))
	);
	return results;
}
