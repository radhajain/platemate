'use client';

import { RecipeGrid } from '@/app/_components/RecipeGrid';
import {
	getAllRecipes,
	getFilteredRecipes,
	getUniqueMealTags,
	getUserLikedRecipeUrls,
	likeAllRecipes,
	toggleLikedRecipe,
	unlikeAllRecipes,
} from '@/services/supabase/api';
import { createClient } from '@/services/supabase/client';
import { MEAL_TAG_OPTIONS } from '@/utilities/prompts/generateMealTags';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Recipe } from '../../../database.types';

function RecipesContent() {
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [likedUrls, setLikedUrls] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(true);
	const [userId, setUserId] = useState<string | null>(null);
	const [bulkActionLoading, setBulkActionLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
	const [availableTags, setAvailableTags] = useState<string[]>([]);

	useEffect(() => {
		async function loadData() {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (user) {
				setUserId(user.id);

				// Load filtered recipes, liked URLs, and available tags in parallel
				const [filteredRecipes, liked, tags] = await Promise.all([
					getFilteredRecipes(user.id),
					getUserLikedRecipeUrls(user.id),
					getUniqueMealTags(),
				]);

				setRecipes(filteredRecipes);
				setLikedUrls(liked);
				setAvailableTags(tags);
			} else {
				// For logged out users, show all recipes and tags
				const [allRecipes, tags] = await Promise.all([
					getAllRecipes(),
					getUniqueMealTags(),
				]);
				setRecipes(allRecipes);
				setAvailableTags(tags);
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

	// Filter recipes by search query and tags
	const filteredRecipes = useMemo(() => {
		return recipes.filter((recipe) => {
			// Search filter
			const matchesSearch =
				searchQuery === '' ||
				recipe.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				recipe.ingredients?.some((ing) =>
					ing.toLowerCase().includes(searchQuery.toLowerCase())
				);

			// Tag filter
			const matchesTags =
				selectedTags.size === 0 ||
				(recipe.dietary_tags &&
					Array.from(selectedTags).some((tag) =>
						recipe.dietary_tags?.includes(tag)
					));

			return matchesSearch && matchesTags;
		});
	}, [recipes, searchQuery, selectedTags]);

	const handleTagToggle = (tag: string) => {
		setSelectedTags((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(tag)) {
				newSet.delete(tag);
			} else {
				newSet.add(tag);
			}
			return newSet;
		});
	};

	const clearFilters = () => {
		setSearchQuery('');
		setSelectedTags(new Set());
	};

	// Calculate stats
	const likedCount = useMemo(() => {
		return recipes.filter((r) => likedUrls.has(r.url)).length;
	}, [recipes, likedUrls]);

	const allFavorited = likedCount === recipes.length && recipes.length > 0;
	const hasActiveFilters = searchQuery !== '' || selectedTags.size > 0;

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
							{hasActiveFilters
								? `${filteredRecipes.length} of ${recipes.length} recipes`
								: `${recipes.length} recipes`}
							{userId && !hasActiveFilters
								? ' match your dietary preferences'
								: ''}
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

				{/* Search and Filter Section */}
				{recipes.length > 0 && (
					<div className="mt-4 space-y-3">
						{/* Search Bar */}
						<div className="relative">
							<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-muted" />
							<input
								type="text"
								placeholder="Search recipes or ingredients..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2.5 border border-cream-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery('')}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal"
								>
									<XIcon className="w-4 h-4" />
								</button>
							)}
						</div>

						{/* Tag Filter Pills */}
						<div className="flex flex-wrap gap-2">
							{(availableTags.length > 0
								? availableTags
								: MEAL_TAG_OPTIONS
							).map((tag) => (
								<button
									key={tag}
									onClick={() => handleTagToggle(tag)}
									className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
										selectedTags.has(tag)
											? 'bg-primary text-white'
											: 'bg-cream-light text-charcoal-muted hover:bg-cream-dark hover:text-charcoal'
									}`}
								>
									{tag}
								</button>
							))}
						</div>

						{/* Active Filters Summary */}
						{hasActiveFilters && (
							<div className="flex items-center gap-2 text-sm">
								<span className="text-charcoal-muted">
									Showing {filteredRecipes.length} result
									{filteredRecipes.length !== 1 ? 's' : ''}
								</span>
								<button
									onClick={clearFilters}
									className="text-primary hover:text-primary-dark font-medium"
								>
									Clear filters
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Recipe Grid with quick view */}
			{filteredRecipes && filteredRecipes.length > 0 ? (
				<RecipeGrid
					recipes={filteredRecipes}
					likedUrls={likedUrls}
					onLikeToggle={handleLikeToggle}
					showSelectButton={false}
					showLikeButton={!!userId}
				/>
			) : hasActiveFilters ? (
				<div className="bg-white rounded-xl p-12 text-center">
					<div className="w-16 h-16 bg-cream-light rounded-full flex items-center justify-center mx-auto mb-4">
						<SearchIcon className="w-8 h-8 text-charcoal-muted" />
					</div>
					<h2 className="text-xl font-semibold text-charcoal mb-2">
						No matching recipes
					</h2>
					<p className="text-charcoal-muted mb-6">
						Try adjusting your search or removing some filters.
					</p>
					<button onClick={clearFilters} className="btn-primary-filled">
						Clear Filters
					</button>
				</div>
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

function SearchIcon({ className }: { className?: string }) {
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
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.3-4.3" />
		</svg>
	);
}

function XIcon({ className }: { className?: string }) {
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
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</svg>
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
