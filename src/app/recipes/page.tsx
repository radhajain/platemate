'use client';

import { RecipeGrid } from '@/app/_components/RecipeGrid';
import {
	getAllRecipes,
	getFilteredRecipes,
	getUserLikedRecipeUrls,
	likeAllRecipes,
	toggleLikedRecipe,
	unlikeAllRecipes,
} from '@/services/supabase/api';
import { createClient } from '@/services/supabase/client';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Recipe } from '../../../database.types';

function RecipesContent() {
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [likedUrls, setLikedUrls] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(true);
	const [userId, setUserId] = useState<string | null>(null);
	const [bulkActionLoading, setBulkActionLoading] = useState(false);

	useEffect(() => {
		async function loadData() {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (user) {
				setUserId(user.id);

				// Load filtered recipes and liked URLs in parallel
				const [filteredRecipes, liked] = await Promise.all([
					getFilteredRecipes(user.id),
					getUserLikedRecipeUrls(user.id),
				]);

				setRecipes(filteredRecipes);
				setLikedUrls(liked);
			} else {
				// For logged out users, show all recipes
				const allRecipes = await getAllRecipes();
				setRecipes(allRecipes);
			}

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

	const handleFavoriteAll = async () => {
		if (!userId || bulkActionLoading) return;

		setBulkActionLoading(true);

		// Optimistic update - add all recipe URLs
		const allUrls = recipes.map((r) => r.url);
		setLikedUrls(new Set(allUrls));

		// Actually like all in database
		await likeAllRecipes(userId, allUrls);

		setBulkActionLoading(false);
	};

	const handleUnfavoriteAll = async () => {
		if (!userId || bulkActionLoading) return;

		setBulkActionLoading(true);

		// Optimistic update - clear all
		setLikedUrls(new Set());

		// Actually unlike all in database
		await unlikeAllRecipes(userId);

		setBulkActionLoading(false);
	};

	// Calculate stats
	const likedCount = useMemo(() => {
		return recipes.filter((r) => likedUrls.has(r.url)).length;
	}, [recipes, likedUrls]);

	const allFavorited = likedCount === recipes.length && recipes.length > 0;

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-charcoal-muted">Loading recipes...</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h1 className="text-xl sm:text-2xl font-bold text-charcoal">
							Recipes
						</h1>
						<p className="text-charcoal-muted text-sm">
							{recipes.length} recipes
							{userId ? ' match your dietary preferences' : ' available'}
							{userId && likedCount > 0 && (
								<span className="text-primary font-medium">
									{' '}
									· {likedCount} favorited
								</span>
							)}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						{userId && recipes.length > 0 && (
							<>
								{!allFavorited ? (
									<button
										onClick={handleFavoriteAll}
										disabled={bulkActionLoading}
										className="btn-primary flex items-center gap-1.5 disabled:opacity-50"
									>
										{bulkActionLoading ? (
											<LoadingSpinner />
										) : (
											<HeartIcon className="w-4 h-4" />
										)}
										<span className="hidden sm:inline">Favorite All</span>
										<span className="sm:hidden">All</span>
									</button>
								) : (
									<button
										onClick={handleUnfavoriteAll}
										disabled={bulkActionLoading}
										className="btn-primary flex items-center gap-1.5 disabled:opacity-50 text-red-500 border-red-200 hover:border-red-500"
									>
										{bulkActionLoading ? (
											<LoadingSpinner />
										) : (
											<HeartFilledIcon className="w-4 h-4" />
										)}
										<span className="hidden sm:inline">Unfavorite All</span>
										<span className="sm:hidden">Clear</span>
									</button>
								)}
							</>
						)}
						<Link href="/recipes/add" className="btn-primary-filled">
							Add Recipe
						</Link>
					</div>
				</div>
			</div>

			{/* Recipe Grid with quick view */}
			{recipes && recipes.length > 0 ? (
				<RecipeGrid
					recipes={recipes}
					likedUrls={likedUrls}
					onLikeToggle={handleLikeToggle}
					showSelectButton={false}
					showLikeButton={!!userId}
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

function HeartIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
		</svg>
	);
}

function HeartFilledIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
		</svg>
	);
}

function LoadingSpinner() {
	return (
		<svg
			className="animate-spin h-4 w-4"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle
				className="opacity-25"
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				strokeWidth="4"
			/>
			<path
				className="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			/>
		</svg>
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
