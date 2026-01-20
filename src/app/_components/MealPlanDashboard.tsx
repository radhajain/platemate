'use client';

import {
	getSuggestedRecipes,
	getUserLikedRecipeUrls,
	removeRecipeFromWeeklyPlan,
	saveWeeklyPlan,
	toggleLikedRecipe,
} from '@/services/supabase/api';
import { User } from '@supabase/supabase-js';
import { format, startOfWeek } from 'date-fns';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Recipe } from '../../../database.types';
import { RecipeCard, RecipeDetailPanel } from './Card';
import { GroceryList } from './GroceryList';

type ViewMode = 'plan' | 'suggestions' | 'browse';

interface MealPlanDashboardProps {
	user: User;
	initialRecipes: Recipe[];
	weeklyStaples?: string[];
}

function MealPlanContent({ user, initialRecipes, weeklyStaples = [] }: MealPlanDashboardProps) {
	const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

	// State
	const [weeklyRecipes, setWeeklyRecipes] = useState<Recipe[]>(initialRecipes);
	const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
	const [selectedForPlan, setSelectedForPlan] = useState<Set<string>>(new Set());
	const [likedUrls, setLikedUrls] = useState<Set<string>>(new Set());
	const [viewMode, setViewMode] = useState<ViewMode>(
		initialRecipes.length > 0 ? 'plan' : 'suggestions'
	);
	const [userRequest, setUserRequest] = useState('');
	const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
	const [suggestionReasoning, setSuggestionReasoning] = useState('');
	const [expandedRecipeUrl, setExpandedRecipeUrl] = useState<string | null>(
		// Auto-expand first recipe if we have recipes
		initialRecipes.length > 0 ? initialRecipes[0].url : null
	);

	// Load liked URLs
	useEffect(() => {
		async function loadLikedUrls() {
			const liked = await getUserLikedRecipeUrls(user.id);
			setLikedUrls(liked);
		}
		loadLikedUrls();
	}, [user.id]);

	// Handle getting suggestions
	const handleGetSuggestions = useCallback(async () => {
		setIsLoadingSuggestions(true);
		const result = await getSuggestedRecipes(user.id, userRequest, 10);
		if (result) {
			// Deduplicate recipes by URL
			const uniqueRecipes = result.recipes.filter(
				(recipe, index, self) => self.findIndex((r) => r.url === recipe.url) === index
			);
			setSuggestedRecipes(uniqueRecipes);
			setSuggestionReasoning(result.reasoning);
			// Clear any previous selections when getting new suggestions
			setSelectedForPlan(new Set());
		}
		setIsLoadingSuggestions(false);
		setViewMode('suggestions');
	}, [user.id, userRequest]);

	// Handle toggling a recipe in the selected plan
	const toggleSelectedForPlan = useCallback((url: string) => {
		setSelectedForPlan((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(url)) {
				newSet.delete(url);
			} else {
				newSet.add(url);
			}
			return newSet;
		});
	}, []);

	// Handle saving the weekly plan
	const handleSavePlan = useCallback(async () => {
		const urls = Array.from(selectedForPlan);
		await saveWeeklyPlan(user.id, urls, weekStart);
		// Update weekly recipes from selected
		const newWeeklyRecipes = suggestedRecipes.filter((r) =>
			selectedForPlan.has(r.url)
		);
		setWeeklyRecipes(newWeeklyRecipes);
		setViewMode('plan');
	}, [selectedForPlan, suggestedRecipes, user.id, weekStart]);

	// Handle removing a recipe from the plan
	const handleRemoveFromPlan = useCallback(
		async (recipeUrl: string) => {
			await removeRecipeFromWeeklyPlan(user.id, recipeUrl, weekStart);
			setWeeklyRecipes((prev) => prev.filter((r) => r.url !== recipeUrl));
		},
		[user.id, weekStart]
	);

	// Handle like toggle
	const handleLikeToggle = useCallback(
		async (recipeUrl: string) => {
			setLikedUrls((prev) => {
				const newSet = new Set(prev);
				if (newSet.has(recipeUrl)) {
					newSet.delete(recipeUrl);
				} else {
					newSet.add(recipeUrl);
				}
				return newSet;
			});
			await toggleLikedRecipe(user.id, recipeUrl);
		},
		[user.id]
	);

	// Calculate row for expanded recipe
	const getExpandedRowIndex = (recipes: Recipe[], url: string, columns: number) => {
		const index = recipes.findIndex((r) => r.url === url);
		if (index === -1) return -1;
		return Math.floor(index / columns);
	};

	// Render recipe grid with quickview
	const renderRecipeGrid = (
		recipes: Recipe[],
		options: {
			showRemove?: boolean;
			showSelect?: boolean;
			columns?: number;
		} = {}
	) => {
		const { showRemove = false, showSelect = false, columns = 4 } = options;
		const rows: Recipe[][] = [];
		for (let i = 0; i < recipes.length; i += columns) {
			rows.push(recipes.slice(i, i + columns));
		}

		const expandedRecipe = recipes.find((r) => r.url === expandedRecipeUrl);
		const expandedRowIndex = expandedRecipeUrl
			? getExpandedRowIndex(recipes, expandedRecipeUrl, columns)
			: -1;

		const gridClass =
			columns === 3
				? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
				: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

		return (
			<div className="space-y-6">
				{rows.map((row, rowIndex) => (
					<div key={rowIndex}>
						<div className={`grid gap-6 ${gridClass}`}>
							{row.map((recipe) => (
								<RecipeCard
									key={recipe.url}
									recipe={recipe}
									isLiked={likedUrls.has(recipe.url)}
									onLikeToggle={() => handleLikeToggle(recipe.url)}
									showLikeButton={true}
									showSelectButton={showSelect}
									isSelected={selectedForPlan.has(recipe.url)}
									onSelect={showSelect ? () => toggleSelectedForPlan(recipe.url) : undefined}
									showRemoveButton={showRemove}
									onRemove={showRemove ? () => handleRemoveFromPlan(recipe.url) : undefined}
									onClick={() =>
										setExpandedRecipeUrl(
											expandedRecipeUrl === recipe.url ? null : recipe.url
										)
									}
									isExpanded={expandedRecipeUrl === recipe.url}
								/>
							))}
							</div>

						{/* Expanded detail panel */}
						{expandedRecipe && expandedRowIndex === rowIndex && (
							<div className="mt-6 animate-in slide-in-from-top-2 duration-200">
								<RecipeDetailPanel
									recipe={expandedRecipe}
									onClose={() => setExpandedRecipeUrl(null)}
									isLiked={likedUrls.has(expandedRecipe.url)}
									onLikeToggle={() => handleLikeToggle(expandedRecipe.url)}
								/>
							</div>
						)}
					</div>
				))}
			</div>
		);
	};

	return (
		<div className="flex flex-col gap-8">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-charcoal">
						Week of {format(weekStart, 'MMMM d')}
					</h1>
					<p className="text-charcoal-muted">
						{weeklyRecipes.length} meal{weeklyRecipes.length !== 1 ? 's' : ''} planned
					</p>
				</div>
				<div className="flex gap-2">
					{viewMode !== 'plan' && weeklyRecipes.length > 0 && (
						<button
							onClick={() => setViewMode('plan')}
							className="btn-primary"
						>
							View Current Plan
						</button>
					)}
					{viewMode === 'plan' && (
						<button
							onClick={() => {
								setViewMode('suggestions');
								if (suggestedRecipes.length === 0) {
									handleGetSuggestions();
								}
							}}
							className="btn-primary-filled"
						>
							{weeklyRecipes.length > 0 ? 'Modify Plan' : 'Create Plan'}
						</button>
					)}
				</div>
			</div>

			{/* Current Plan View */}
			{viewMode === 'plan' && weeklyRecipes.length > 0 && (
				<div className="grid lg:grid-cols-3 gap-8">
					{/* Recipes */}
					<div className="lg:col-span-2">
						<h2 className="section-header mb-4">This Week&apos;s Meals</h2>
						{renderRecipeGrid(weeklyRecipes, {
							showRemove: true,
							columns: 3,
						})}
						<button
							onClick={() => {
								setViewMode('suggestions');
								if (suggestedRecipes.length === 0) {
									handleGetSuggestions();
								}
							}}
							className="mt-4 text-sm text-charcoal-muted hover:text-primary transition-colors flex items-center gap-1"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="w-4 h-4"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 4.5v15m7.5-7.5h-15"
								/>
							</svg>
							Add more recipes
						</button>
					</div>

					{/* Grocery List */}
					<div>
						<h2 className="section-header mb-4">Shopping List</h2>
						<GroceryList recipes={weeklyRecipes} weeklyStaples={weeklyStaples} />
					</div>
				</div>
			)}

			{/* Empty Plan State */}
			{viewMode === 'plan' && weeklyRecipes.length === 0 && (
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
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
							<line x1="16" y1="2" x2="16" y2="6" />
							<line x1="8" y1="2" x2="8" y2="6" />
							<line x1="3" y1="10" x2="21" y2="10" />
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-charcoal mb-2">
						No meals planned yet
					</h2>
					<p className="text-charcoal-muted mb-6">
						Tell us what you&apos;re in the mood for and we&apos;ll suggest some recipes.
					</p>
					<button
						onClick={() => setViewMode('suggestions')}
						className="btn-primary-filled"
					>
						Plan Your Week
					</button>
				</div>
			)}

			{/* Suggestions View */}
			{viewMode === 'suggestions' && (
				<div className="space-y-8">
					{/* Request Input */}
					<div className="bg-white rounded-xl p-6">
						<h2 className="text-lg font-semibold text-charcoal mb-2">
							What are you in the mood for this week?
						</h2>
						<p className="text-sm text-charcoal-muted mb-4">
							Tell us your preferences and we&apos;ll suggest recipes that match.
						</p>
						<div className="flex flex-col sm:flex-row gap-3">
							<input
								type="text"
								value={userRequest}
								onChange={(e) => setUserRequest(e.target.value)}
								placeholder="e.g., Soups, high protein, veggie-focused, quick meals..."
								className="flex-1 px-4 py-3 rounded-lg border border-cream-dark focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleGetSuggestions();
									}
								}}
							/>
							<button
								onClick={handleGetSuggestions}
								disabled={isLoadingSuggestions}
								className="btn-primary-filled whitespace-nowrap disabled:opacity-50"
							>
								{isLoadingSuggestions ? 'Loading...' : 'Get Suggestions'}
							</button>
						</div>
						<div className="flex flex-wrap gap-2 mt-3">
							{['Quick weeknight meals', 'Comfort food', 'Healthy & light', 'Meal prep friendly'].map(
								(suggestion) => (
									<button
										key={suggestion}
										onClick={() => {
											setUserRequest(suggestion);
										}}
										className="px-3 py-1 text-sm rounded-full bg-cream hover:bg-cream-dark text-charcoal-muted transition-colors"
									>
										{suggestion}
									</button>
								)
							)}
						</div>
					</div>

					{/* Suggestions Grid */}
					{suggestedRecipes.length > 0 && (
						<div>
							<div className="flex items-center justify-between mb-4">
								<div>
									<h2 className="section-header">
										Suggested Recipes ({selectedForPlan.size} selected)
									</h2>
									{suggestionReasoning && (
										<p className="text-sm text-charcoal-muted mt-1">
											{suggestionReasoning}
										</p>
									)}
								</div>
								<button
									onClick={handleSavePlan}
									disabled={selectedForPlan.size === 0}
									className="btn-primary-filled disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Save Plan ({selectedForPlan.size} meals)
								</button>
							</div>
							{renderRecipeGrid(suggestedRecipes, {
								showSelect: true,
								columns: 4,
							})}
						</div>
					)}

					{/* Loading state */}
					{isLoadingSuggestions && (
						<div className="flex items-center justify-center py-12">
							<div className="text-charcoal-muted">Finding the perfect recipes...</div>
						</div>
					)}

					{/* No suggestions yet */}
					{!isLoadingSuggestions && suggestedRecipes.length === 0 && (
						<div className="text-center py-12 text-charcoal-muted">
							Enter your preferences above and click &quot;Get Suggestions&quot; to see
							recipe recommendations.
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export function MealPlanDashboard(props: MealPlanDashboardProps) {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[60vh]">
					<div className="text-charcoal-muted">Loading meal plan...</div>
				</div>
			}
		>
			<MealPlanContent {...props} />
		</Suspense>
	);
}
