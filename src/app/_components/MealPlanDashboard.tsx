'use client';

import {
	getSuggestedRecipes,
	getUserLikedRecipes,
	getUserLikedRecipeUrls,
	removeRecipeFromWeeklyPlan,
	saveWeeklyPlan,
	toggleLikedRecipe,
} from '@/services/supabase/api';
import { User } from '@supabase/supabase-js';
import { format, startOfWeek } from 'date-fns';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Recipe } from '../../../database.types';
import { RecipeCard, RecipeDetailPanel } from './Card';
import { GroceryList } from './GroceryList';

type ViewMode = 'plan' | 'wizard';
type WizardStep = 1 | 2 | 3 | 4;

const MOOD_TAGS = [
	'Quick weeknight meals',
	'Comfort food',
	'Healthy & light',
	'Meal prep friendly',
	'High protein',
	'Veggie-focused',
	'Soups & stews',
	'One-pot meals',
	'Budget-friendly',
	'Date night',
];

interface MealPlanDashboardProps {
	user: User;
	initialRecipes: Recipe[];
	weeklyStaples?: string[];
}

function MealPlanContent({ user, initialRecipes, weeklyStaples = [] }: MealPlanDashboardProps) {
	const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

	// Core state
	const [weeklyRecipes, setWeeklyRecipes] = useState<Recipe[]>(initialRecipes);
	const [viewMode, setViewMode] = useState<ViewMode>(
		initialRecipes.length > 0 ? 'plan' : 'wizard'
	);
	const [likedUrls, setLikedUrls] = useState<Set<string>>(new Set());
	const [expandedRecipeUrl, setExpandedRecipeUrl] = useState<string | null>(
		initialRecipes.length > 0 ? initialRecipes[0].url : null
	);

	// Wizard state
	const [wizardStep, setWizardStep] = useState<WizardStep>(1);
	const [hasSpecificDishes, setHasSpecificDishes] = useState<boolean | null>(null);
	const [allLikedRecipes, setAllLikedRecipes] = useState<Recipe[]>([]);
	const [isLoadingLikedRecipes, setIsLoadingLikedRecipes] = useState(false);
	const [manuallyChosen, setManuallyChosen] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedMoodTags, setSelectedMoodTags] = useState<Set<string>>(new Set());
	const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
	const [selectedForPlan, setSelectedForPlan] = useState<Set<string>>(new Set());
	const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
	const [suggestionReasoning, setSuggestionReasoning] = useState('');

	// Load liked URLs
	useEffect(() => {
		async function loadLikedUrls() {
			const liked = await getUserLikedRecipeUrls(user.id);
			setLikedUrls(liked);
		}
		loadLikedUrls();
	}, [user.id]);

	// Load all liked recipes when entering wizard
	const loadLikedRecipesForChoosing = useCallback(async () => {
		if (allLikedRecipes.length > 0) return;
		setIsLoadingLikedRecipes(true);
		const recipes = await getUserLikedRecipes(user.id);
		setAllLikedRecipes(recipes);
		setIsLoadingLikedRecipes(false);
	}, [user.id, allLikedRecipes.length]);

	// Filter recipes by search query
	const filteredRecipes = useMemo(() => {
		if (!searchQuery.trim()) return allLikedRecipes;
		const query = searchQuery.toLowerCase();
		return allLikedRecipes.filter(
			(recipe) =>
				recipe.name?.toLowerCase().includes(query) ||
				recipe.ingredients?.some((ing) => ing.toLowerCase().includes(query))
		);
	}, [allLikedRecipes, searchQuery]);

	// Toggle manually chosen recipe
	const toggleManuallyChosen = useCallback((url: string) => {
		setManuallyChosen((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(url)) {
				newSet.delete(url);
			} else {
				newSet.add(url);
			}
			return newSet;
		});
	}, []);

	// Toggle mood tag
	const toggleMoodTag = useCallback((tag: string) => {
		setSelectedMoodTags((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(tag)) {
				newSet.delete(tag);
			} else {
				newSet.add(tag);
			}
			return newSet;
		});
	}, []);

	// Handle getting suggestions
	const handleGetSuggestions = useCallback(async () => {
		setIsLoadingSuggestions(true);
		const moodString = Array.from(selectedMoodTags).join(', ');
		const result = await getSuggestedRecipes(user.id, moodString, 10);
		if (result) {
			// Deduplicate and exclude manually chosen recipes
			const uniqueRecipes = result.recipes.filter(
				(recipe, index, self) =>
					self.findIndex((r) => r.url === recipe.url) === index &&
					!manuallyChosen.has(recipe.url)
			);
			setSuggestedRecipes(uniqueRecipes);
			setSuggestionReasoning(result.reasoning);
			setSelectedForPlan(new Set());
		}
		setIsLoadingSuggestions(false);
	}, [user.id, selectedMoodTags, manuallyChosen]);

	// Toggle selected for plan
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
		const allSelectedUrls = new Set([...manuallyChosen, ...selectedForPlan]);
		const urls = Array.from(allSelectedUrls);
		await saveWeeklyPlan(user.id, urls, weekStart);

		// Combine recipes from both sources
		const chosenRecipes = allLikedRecipes.filter((r) => manuallyChosen.has(r.url));
		const aiSelectedRecipes = suggestedRecipes.filter((r) => selectedForPlan.has(r.url));
		const allRecipes = [...chosenRecipes];
		for (const r of aiSelectedRecipes) {
			if (!allRecipes.some((existing) => existing.url === r.url)) {
				allRecipes.push(r);
			}
		}
		setWeeklyRecipes(allRecipes);
		setViewMode('plan');
		resetWizard();
	}, [selectedForPlan, manuallyChosen, suggestedRecipes, allLikedRecipes, user.id, weekStart]);

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

	// Reset wizard state
	const resetWizard = useCallback(() => {
		setWizardStep(1);
		setHasSpecificDishes(null);
		setManuallyChosen(new Set());
		setSearchQuery('');
		setSelectedMoodTags(new Set());
		setSuggestedRecipes([]);
		setSelectedForPlan(new Set());
		setSuggestionReasoning('');
	}, []);

	// Start wizard
	const startWizard = useCallback(() => {
		resetWizard();
		setViewMode('wizard');
		loadLikedRecipesForChoosing();
	}, [resetWizard, loadLikedRecipesForChoosing]);

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
			selectedSet?: Set<string>;
			onSelect?: (url: string) => void;
		} = {}
	) => {
		const {
			showRemove = false,
			showSelect = false,
			columns = 4,
			selectedSet = selectedForPlan,
			onSelect = toggleSelectedForPlan,
		} = options;
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
									isSelected={selectedSet.has(recipe.url)}
									onSelect={showSelect ? () => onSelect(recipe.url) : undefined}
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

	// Get selected recipes for final review
	const getSelectedRecipes = useCallback(() => {
		const chosen = allLikedRecipes.filter((r) => manuallyChosen.has(r.url));
		const aiSelected = suggestedRecipes.filter((r) => selectedForPlan.has(r.url));
		const all = [...chosen];
		for (const r of aiSelected) {
			if (!all.some((existing) => existing.url === r.url)) {
				all.push(r);
			}
		}
		return all;
	}, [allLikedRecipes, manuallyChosen, suggestedRecipes, selectedForPlan]);

	const totalSelected = manuallyChosen.size + selectedForPlan.size;

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
					{viewMode === 'wizard' && (
						<button
							onClick={() => {
								setViewMode('plan');
								resetWizard();
							}}
							className="btn-primary"
						>
							Cancel
						</button>
					)}
					{viewMode === 'plan' && (
						<button onClick={startWizard} className="btn-primary-filled">
							{weeklyRecipes.length > 0 ? 'Modify Plan' : 'Create Plan'}
						</button>
					)}
				</div>
			</div>

			{/* Current Plan View */}
			{viewMode === 'plan' && weeklyRecipes.length > 0 && (
				<div className="grid lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2">
						<h2 className="section-header mb-4">This Week&apos;s Meals</h2>
						{renderRecipeGrid(weeklyRecipes, {
							showRemove: true,
							columns: 3,
						})}
						<button
							onClick={startWizard}
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
						Let&apos;s plan your meals for the week.
					</p>
					<button onClick={startWizard} className="btn-primary-filled">
						Start Planning
					</button>
				</div>
			)}

			{/* Wizard */}
			{viewMode === 'wizard' && (
				<div className="space-y-6">
					{/* Progress bar */}
					<div className="bg-white rounded-xl p-4">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm text-charcoal-muted">Step {wizardStep} of 4</span>
							<span className="text-sm text-charcoal-muted">
								{totalSelected} recipe{totalSelected !== 1 ? 's' : ''} selected
							</span>
						</div>
						<div className="h-2 bg-cream rounded-full overflow-hidden">
							<div
								className="h-full bg-primary transition-all duration-300"
								style={{ width: `${(wizardStep / 4) * 100}%` }}
							/>
						</div>
					</div>

					{/* Step 1: Do you have specific dishes? */}
					{wizardStep === 1 && (
						<div className="bg-white rounded-xl p-8 text-center">
							<h2 className="text-xl font-semibold text-charcoal mb-2">
								Do you have specific dishes in mind?
							</h2>
							<p className="text-charcoal-muted mb-8">
								Select recipes you know you want to cook this week, or skip to get AI suggestions.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<button
									onClick={() => {
										setHasSpecificDishes(true);
										setWizardStep(2);
									}}
									className="btn-primary px-8 py-4"
								>
									Yes, let me choose
								</button>
								<button
									onClick={() => {
										setHasSpecificDishes(false);
										setWizardStep(3);
									}}
									className="btn-primary-filled px-8 py-4"
								>
									No, suggest recipes for me
								</button>
							</div>
						</div>
					)}

					{/* Step 2: Choose Your Own */}
					{wizardStep === 2 && (
						<div className="space-y-6">
							<div className="bg-white rounded-xl p-6">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
									<div>
										<h2 className="text-lg font-semibold text-charcoal">
											Choose Your Own Meals
										</h2>
										<p className="text-sm text-charcoal-muted">
											Select recipes from your favorites ({manuallyChosen.size} selected)
										</p>
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => setWizardStep(1)}
											className="btn-primary"
										>
											Back
										</button>
										<button
											onClick={() => setWizardStep(3)}
											className="btn-primary-filled"
										>
											{manuallyChosen.size > 0 ? 'Continue' : 'Skip'}
										</button>
									</div>
								</div>

								{/* Search bar */}
								<div className="relative">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
										/>
									</svg>
									<input
										type="text"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Search recipes by name or ingredient..."
										className="w-full pl-10 pr-4 py-3 rounded-lg border border-cream-dark focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
									/>
								</div>
							</div>

							{isLoadingLikedRecipes && (
								<div className="flex items-center justify-center py-12">
									<div className="text-charcoal-muted">Loading your recipes...</div>
								</div>
							)}

							{!isLoadingLikedRecipes && allLikedRecipes.length === 0 && (
								<div className="text-center py-12 text-charcoal-muted">
									No liked recipes found. Browse recipes and add some favorites first.
								</div>
							)}

							{!isLoadingLikedRecipes && filteredRecipes.length > 0 && (
								<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
									{filteredRecipes.map((recipe) => (
										<RecipeCard
											key={recipe.url}
											recipe={recipe}
											isLiked={likedUrls.has(recipe.url)}
											onLikeToggle={() => handleLikeToggle(recipe.url)}
											showLikeButton={true}
											showSelectButton={true}
											isSelected={manuallyChosen.has(recipe.url)}
											onSelect={() => toggleManuallyChosen(recipe.url)}
											onClick={() =>
												setExpandedRecipeUrl(
													expandedRecipeUrl === recipe.url ? null : recipe.url
												)
											}
											isExpanded={expandedRecipeUrl === recipe.url}
										/>
									))}
								</div>
							)}

							{!isLoadingLikedRecipes && filteredRecipes.length === 0 && allLikedRecipes.length > 0 && (
								<div className="text-center py-12 text-charcoal-muted">
									No recipes match your search.
								</div>
							)}
						</div>
					)}

					{/* Step 3: What are you in the mood for? */}
					{wizardStep === 3 && (
						<div className="space-y-6">
							<div className="bg-white rounded-xl p-6">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
									<div>
										<h2 className="text-lg font-semibold text-charcoal">
											What are you in the mood for?
										</h2>
										<p className="text-sm text-charcoal-muted">
											Select all that apply - we&apos;ll suggest recipes that match
										</p>
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => setWizardStep(hasSpecificDishes ? 2 : 1)}
											className="btn-primary"
										>
											Back
										</button>
										<button
											onClick={() => {
												handleGetSuggestions();
												setWizardStep(4);
											}}
											className="btn-primary-filled"
										>
											Get Suggestions
										</button>
									</div>
								</div>

								<div className="flex flex-wrap gap-3">
									{MOOD_TAGS.map((tag) => (
										<button
											key={tag}
											onClick={() => toggleMoodTag(tag)}
											className={`px-4 py-2 rounded-full border-2 transition-all ${
												selectedMoodTags.has(tag)
													? 'border-primary bg-primary/10 text-primary'
													: 'border-cream-dark hover:border-primary text-charcoal-muted'
											}`}
										>
											{tag}
										</button>
									))}
								</div>

								{manuallyChosen.size > 0 && (
									<div className="mt-6 pt-6 border-t border-cream-dark">
										<p className="text-sm text-charcoal-muted mb-3">
											Already selected ({manuallyChosen.size}):
										</p>
										<div className="flex flex-wrap gap-2">
											{allLikedRecipes
												.filter((r) => manuallyChosen.has(r.url))
												.map((recipe) => (
													<span
														key={recipe.url}
														className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
													>
														{recipe.name}
														<button
															onClick={() => toggleManuallyChosen(recipe.url)}
															className="hover:bg-primary/20 rounded-full p-0.5"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																viewBox="0 0 20 20"
																fill="currentColor"
																className="w-3 h-3"
															>
																<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
															</svg>
														</button>
													</span>
												))}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Step 4: Suggestions & Final Review */}
					{wizardStep === 4 && (
						<div className="space-y-6">
							<div className="bg-white rounded-xl p-6">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
									<div>
										<h2 className="text-lg font-semibold text-charcoal">
											Your Meal Plan
										</h2>
										<p className="text-sm text-charcoal-muted">
											{totalSelected} recipe{totalSelected !== 1 ? 's' : ''} selected
										</p>
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => setWizardStep(3)}
											className="btn-primary"
										>
											Back
										</button>
										<button
											onClick={handleSavePlan}
											disabled={totalSelected === 0}
											className="btn-primary-filled disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Save Plan
										</button>
									</div>
								</div>
							</div>

							{/* Manually chosen recipes */}
							{manuallyChosen.size > 0 && (
								<div>
									<h3 className="section-header mb-4">
										Your Picks ({manuallyChosen.size})
									</h3>
									<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
										{allLikedRecipes
											.filter((r) => manuallyChosen.has(r.url))
											.map((recipe) => (
												<RecipeCard
													key={recipe.url}
													recipe={recipe}
													isLiked={likedUrls.has(recipe.url)}
													onLikeToggle={() => handleLikeToggle(recipe.url)}
													showLikeButton={true}
													showSelectButton={true}
													isSelected={true}
													onSelect={() => toggleManuallyChosen(recipe.url)}
												/>
											))}
									</div>
								</div>
							)}

							{/* AI Suggestions */}
							{isLoadingSuggestions && (
								<div className="flex items-center justify-center py-12">
									<div className="text-charcoal-muted">Finding the perfect recipes...</div>
								</div>
							)}

							{!isLoadingSuggestions && suggestedRecipes.length > 0 && (
								<div>
									<div className="mb-4">
										<h3 className="section-header">
											AI Suggestions ({selectedForPlan.size} selected)
										</h3>
										{suggestionReasoning && (
											<p className="text-sm text-charcoal-muted mt-1">
												{suggestionReasoning}
											</p>
										)}
									</div>
									{renderRecipeGrid(suggestedRecipes, {
										showSelect: true,
										columns: 4,
									})}
								</div>
							)}

							{!isLoadingSuggestions && suggestedRecipes.length === 0 && manuallyChosen.size === 0 && (
								<div className="text-center py-12 text-charcoal-muted">
									No suggestions available. Try selecting different mood tags.
								</div>
							)}

							{/* Final grocery list preview */}
							{totalSelected > 0 && (
								<div className="bg-cream-light rounded-xl p-6">
									<h3 className="section-header mb-4">Grocery List Preview</h3>
									<GroceryList recipes={getSelectedRecipes()} weeklyStaples={weeklyStaples} />
								</div>
							)}
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
