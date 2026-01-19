'use client';

import { RecipeForm } from '@/app/_components/RecipeForm';
import { createClient } from '@/services/supabase/client';
import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function AddRecipePage() {
	const [isLoading, setIsLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const router = useRouter();
	const supabase = createClient();

	const handleSubmit = async (data: {
		name: string;
		image: string;
		prepTime: string;
		cookTime: string;
		servings: string;
		ingredients: string[];
		instructions: string[];
		notes: string;
	}) => {
		setIsLoading(true);
		setError(null);

		try {
			// Generate a unique URL for the recipe
			const slug = data.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '');
			const url = `custom://${slug}-${Date.now()}`;

			const { error: insertError } = await supabase.from('recipes').insert({
				url,
				name: data.name,
				image: data.image || null,
				prepTime: data.prepTime || null,
				cookTime: data.cookTime || null,
				servings: data.servings || null,
				ingredients: data.ingredients,
				instructions: data.instructions,
				notes: data.notes || null,
			});

			if (insertError) {
				throw insertError;
			}

			// Redirect to recipes page
			router.push('/recipes');
		} catch (err) {
			console.error('Error saving recipe:', err);
			setError('Failed to save recipe. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto">
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-charcoal">Add New Recipe</h1>
				<p className="text-charcoal-muted">
					Add your own recipe to your collection
				</p>
			</div>

			{error && (
				<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
					{error}
				</div>
			)}

			<RecipeForm onSubmit={handleSubmit} isLoading={isLoading} />
		</div>
	);
}
