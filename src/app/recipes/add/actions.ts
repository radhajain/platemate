'use server';

import { scrapingService } from '@/services/scraping/scrapingService';
import { createClient } from '@/services/supabase/server';
import { llmStructured } from '@/utilities/llm';
import {
	generateMealTagsPrompt,
	MEAL_TAG_OPTIONS,
	MEAL_TAG_SCHEMA,
	MealTagResult,
} from '@/utilities/prompts/generateMealTags';
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

/**
 * Generate meal tags for a recipe using LLM
 * This runs in the background after a recipe is saved
 */
export async function generateMealTagsForRecipe(
	recipeUrl: string
): Promise<{ success: boolean; tags?: string[]; error?: string }> {
	try {
		const supabase = await createClient();

		// Get the recipe
		const { data: recipe, error: fetchError } = await supabase
			.from('recipes')
			.select('*')
			.eq('url', recipeUrl)
			.single();

		if (fetchError || !recipe) {
			return { success: false, error: 'Recipe not found' };
		}

		// Skip if already has tags
		if (recipe.dietary_tags && recipe.dietary_tags.length > 0) {
			return { success: true, tags: recipe.dietary_tags };
		}

		// Generate tags using LLM
		const prompt = generateMealTagsPrompt(recipe);
		const result = await llmStructured<MealTagResult>(
			prompt.systemPrompt,
			prompt.taskPrompt,
			MEAL_TAG_SCHEMA
		);

		if (!result || !result.tags || result.tags.length === 0) {
			return { success: false, error: 'Failed to generate tags' };
		}

		// Filter to only allowed tags
		const validTags = result.tags.filter((tag) =>
			MEAL_TAG_OPTIONS.includes(tag as (typeof MEAL_TAG_OPTIONS)[number])
		);

		// Save tags to database
		const { error: updateError } = await supabase
			.from('recipes')
			.update({ dietary_tags: validTags })
			.eq('url', recipeUrl);

		if (updateError) {
			return { success: false, error: updateError.message };
		}

		return { success: true, tags: validTags };
	} catch (error) {
		console.error('Error generating meal tags:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
