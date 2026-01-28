import { createClient } from '@/services/supabase/server';
import { llmStructured } from '@/utilities/llm';
import {
	generateMealTagsPrompt,
	MEAL_TAG_SCHEMA,
	MealTagResult,
	MEAL_TAG_OPTIONS,
} from '@/utilities/prompts/generateMealTags';
import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes max for this API route

export async function POST(request: Request) {
	try {
		// Optional: Add auth check or secret key for security
		const { searchParams } = new URL(request.url);
		const secret = searchParams.get('secret');

		// Simple security check - you can change this or remove for local dev
		if (process.env.BACKFILL_SECRET && secret !== process.env.BACKFILL_SECRET) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const supabase = await createClient();

		// Get all recipes without dietary_tags (or with empty array)
		const { data: recipes, error: fetchError } = await supabase
			.from('recipes')
			.select('*')
			.is('dietary_tags', null)
			.limit(50); // Process in batches to avoid timeout

		if (fetchError) {
			console.error('Error fetching recipes:', fetchError);
			return NextResponse.json(
				{ error: 'Failed to fetch recipes', details: fetchError.message },
				{ status: 500 }
			);
		}

		if (!recipes || recipes.length === 0) {
			return NextResponse.json({
				message: 'No recipes need dietary tags',
				processed: 0,
			});
		}

		const results: { url: string; name: string | null; tags: string[] | null; error?: string }[] = [];

		// Process each recipe
		for (const recipe of recipes) {
			try {
				// Generate tags using LLM
				const prompt = generateMealTagsPrompt(recipe);
				const result = await llmStructured<MealTagResult>(
					prompt.systemPrompt,
					prompt.taskPrompt,
					MEAL_TAG_SCHEMA
				);

				if (!result || !result.tags || result.tags.length === 0) {
					results.push({
						url: recipe.url,
						name: recipe.name,
						tags: null,
						error: 'LLM returned no tags',
					});
					continue;
				}

				// Filter to only allowed tags
				const validTags = result.tags.filter((tag) =>
					MEAL_TAG_OPTIONS.includes(tag as (typeof MEAL_TAG_OPTIONS)[number])
				);

				// Save tags to database
				const { error: updateError } = await supabase
					.from('recipes')
					.update({ dietary_tags: validTags })
					.eq('url', recipe.url);

				if (updateError) {
					results.push({
						url: recipe.url,
						name: recipe.name,
						tags: null,
						error: updateError.message,
					});
				} else {
					results.push({
						url: recipe.url,
						name: recipe.name,
						tags: validTags,
					});
				}

				// Add a small delay to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 500));
			} catch (err) {
				results.push({
					url: recipe.url,
					name: recipe.name,
					tags: null,
					error: err instanceof Error ? err.message : 'Unknown error',
				});
			}
		}

		const successful = results.filter((r) => r.tags !== null).length;
		const failed = results.filter((r) => r.tags === null).length;

		return NextResponse.json({
			message: `Processed ${recipes.length} recipes`,
			successful,
			failed,
			results,
		});
	} catch (error) {
		console.error('Backfill error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// GET endpoint to check status
export async function GET() {
	try {
		const supabase = await createClient();

		// Count recipes with and without tags
		const { count: withTags } = await supabase
			.from('recipes')
			.select('*', { count: 'exact', head: true })
			.not('dietary_tags', 'is', null);

		const { count: withoutTags } = await supabase
			.from('recipes')
			.select('*', { count: 'exact', head: true })
			.is('dietary_tags', null);

		const { count: total } = await supabase
			.from('recipes')
			.select('*', { count: 'exact', head: true });

		return NextResponse.json({
			total,
			withTags,
			withoutTags,
			percentComplete: total ? Math.round(((withTags || 0) / total) * 100) : 0,
		});
	} catch (error) {
		console.error('Status check error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
