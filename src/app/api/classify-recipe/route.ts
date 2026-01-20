import { llmJSON } from '@/utilities/llm';
import {
	classifyRecipeDietPrompt,
	DietaryClassificationResult,
} from '@/utilities/prompts/classifyRecipeDiet';
import { createClient } from '@/services/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST: Classify a single recipe by URL
export async function POST(request: NextRequest) {
	try {
		const { recipeUrl } = await request.json();

		if (!recipeUrl) {
			return NextResponse.json(
				{ error: 'Recipe URL is required' },
				{ status: 400 }
			);
		}

		const supabase = await createClient();

		// Get the recipe
		const { data: recipe, error: fetchError } = await supabase
			.from('recipes')
			.select('*')
			.eq('url', recipeUrl)
			.single();

		if (fetchError || !recipe) {
			return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
		}

		// Skip if already classified
		if (recipe.dietary_tags && recipe.dietary_tags.length > 0) {
			return NextResponse.json({
				message: 'Recipe already classified',
				dietaryTags: recipe.dietary_tags,
			});
		}

		// Classify with Claude
		const prompt = classifyRecipeDietPrompt(recipe);
		const result = await llmJSON<DietaryClassificationResult>(prompt);

		if (!result) {
			return NextResponse.json(
				{ error: 'Failed to classify recipe' },
				{ status: 500 }
			);
		}

		// Update recipe with dietary tags
		const { error: updateError } = await supabase
			.from('recipes')
			.update({ dietary_tags: result.dietaryTags })
			.eq('url', recipeUrl);

		if (updateError) {
			return NextResponse.json(
				{ error: 'Failed to update recipe' },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			message: 'Recipe classified successfully',
			dietaryTags: result.dietaryTags,
			reasoning: result.reasoning,
		});
	} catch (error) {
		console.error('Classification error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// GET: Batch classify all unclassified recipes
export async function GET() {
	try {
		const supabase = await createClient();

		// Get all recipes without dietary tags
		const { data: recipes, error: fetchError } = await supabase
			.from('recipes')
			.select('*')
			.or('dietary_tags.is.null,dietary_tags.eq.{}');

		if (fetchError) {
			return NextResponse.json(
				{ error: 'Failed to fetch recipes' },
				{ status: 500 }
			);
		}

		if (!recipes || recipes.length === 0) {
			return NextResponse.json({
				message: 'No recipes to classify',
				classified: 0,
			});
		}

		const results: { url: string; tags: string[]; reasoning: string }[] = [];
		const errors: { url: string; error: string }[] = [];

		// Process recipes one at a time to avoid rate limits
		for (const recipe of recipes) {
			try {
				const prompt = classifyRecipeDietPrompt(recipe);
				const result = await llmJSON<DietaryClassificationResult>(prompt);

				if (result) {
					// Update recipe with dietary tags
					await supabase
						.from('recipes')
						.update({ dietary_tags: result.dietaryTags })
						.eq('url', recipe.url);

					results.push({
						url: recipe.url,
						tags: result.dietaryTags,
						reasoning: result.reasoning,
					});
				} else {
					errors.push({ url: recipe.url, error: 'Classification failed' });
				}

				// Small delay between API calls to avoid rate limits
				await new Promise((resolve) => setTimeout(resolve, 500));
			} catch (err) {
				errors.push({
					url: recipe.url,
					error: err instanceof Error ? err.message : 'Unknown error',
				});
			}
		}

		return NextResponse.json({
			message: `Classified ${results.length} recipes`,
			classified: results.length,
			failed: errors.length,
			results,
			errors,
		});
	} catch (error) {
		console.error('Batch classification error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
