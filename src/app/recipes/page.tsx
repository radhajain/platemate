'use client';

import { RecipeGrid } from '@/app/_components/RecipeGrid';
import {
	getFilteredRecipes,
	getUserLikedRecipeUrls,
	toggleLikedRecipe,
} from '@/services/supabase/api';
import { createClient } from '@/services/supabase/client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { Recipe } from '../../../database.types';

function RecipesContent() {
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [likedUrls, setLikedUrls] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(true);
	const [userId, setUserId] = useState<string | null>(null);

	useEffect(() => {
		async function loadData() {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) return;

			setUserId(user.id);

			// Load filtered recipes and liked URLs in parallel
			const [filteredRecipes, liked] = await Promise.all([
				getFilteredRecipes(user.id),
				getUserLikedRecipeUrls(user.id),
			]);

			setRecipes(filteredRecipes);
			setLikedUrls(liked);
			setLoading(false);
		}

		loadData();
	}, []);

	const handleLikeToggle = async (recipeUrl: string) => {
		if (!userId) return;

		// Optimistic update
		setLikedUrls((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(recipeUrl)) {
				newSet.delete(recipeUrl);
			} else {
				newSet.add(recipeUrl);
			}
			return newSet;
		});

		// Actually toggle in database
		await toggleLikedRecipe(userId, recipeUrl);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-charcoal-muted">Loading recipes...</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-charcoal">Recipes</h1>
					<p className="text-charcoal-muted">
						{recipes.length} recipes match your dietary preferences
					</p>
				</div>
				<Link href="/recipes/add" className="btn-primary-filled">
					Add Recipe
				</Link>
			</div>

			{/* Recipe Grid with quick view */}
			{recipes && recipes.length > 0 ? (
				<RecipeGrid
					recipes={recipes}
					likedUrls={likedUrls}
					onLikeToggle={handleLikeToggle}
					showSelectButton={false}
					showLikeButton={true}
				/>
			) : (
				<div className="bg-white rounded-xl p-12 text-center">
					<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-primary"
						>
							<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
							<line x1="6" y1="17" x2="18" y2="17" />
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-charcoal mb-2">
						No recipes yet
					</h2>
					<p className="text-charcoal-muted mb-6">
						Start by adding your first recipe to the collection.
					</p>
					<Link href="/recipes/add" className="btn-primary-filled inline-block">
						Add Your First Recipe
					</Link>
				</div>
			)}
		</div>
	);
}

export default function RecipesPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[60vh]">
					<div className="text-charcoal-muted">Loading recipes...</div>
				</div>
			}
		>
			<RecipesContent />
		</Suspense>
	);
}
