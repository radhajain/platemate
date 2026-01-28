'use client';

import {
	getSuggestedRecipes,
	getUserLikedRecipes,
	getUserLikedRecipeUrls,
	removeRecipeFromWeeklyPlan,
	saveWeeklyPlan,
	toggleLikedRecipe,
} from '@/services/supabase/api';
import { calculateIngredientStats } from '@/utilities/ingredientStats';
import { User } from '@supabase/supabase-js';
import { format, startOfWeek } from 'date-fns';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Recipe } from '../../../database.types';
import { RecipeCard, RecipeDetailPanel } from './Card';
import { GroceryList } from './GroceryList';
import { MealPrepInstructions } from './MealPrepInstructions';
import { RecipeDialog } from './RecipeDialog';

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

function MealPlanContent({
	user,
	initialRecipes,
	weeklyStaples = [],
}: MealPlanDashboardProps) {
	const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

	// Core state
	const [weeklyRecipes, setWeeklyRecipes] = useState<Recipe[]>(initialRecipes);
	const [viewMode, setViewMode] = useState<ViewMode>(
		initialRecipes.length > 0 ? 'plan' : 'wizard',
	);
	const [likedUrls, setLikedUrls] = useState<Set<string>>(new Set());
	const [expandedRecipeUrl, setExpandedRecipeUrl] = useState<string | null>(
		initialRecipes.length > 0 ? initialRecipes[0].url : null,
	);
	const [dialogRecipe, setDialogRecipe] = useState<Recipe | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isShoppingExpanded, setIsShoppingExpanded] = useState(true);
	const [isPrepExpanded, setIsPrepExpanded] = useState(true);
	const [isSharedIngredientsExpanded, setIsSharedIngredientsExpanded] = useState(false);

	// Wizard state
	const [wizardStep, setWizardStep] = useState<WizardStep>(1);
	const [hasSpecificDishes, setHasSpecificDishes] = useState<boolean | null>(
		null,
	);
	const [allLikedRecipes, setAllLikedRecipes] = useState<Recipe[]>([]);
	const [isLoadingLikedRecipes, setIsLoadingLikedRecipes] = useState(false);
	const [manuallyChosen, setManuallyChosen] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedMoodTags, setSelectedMoodTags] = useState<Set<string>>(
		new Set(),
	);
	const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
	const [selectedForPlan, setSelectedForPlan] = useState<Set<string>>(
		new Set(),
	);
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
				recipe.ingredients?.some((ing) => ing.toLowerCase().includes(query)),
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
		if (result && result.recipes.length > 0) {
			// Deduplicate and exclude manually chosen recipes
			const uniqueRecipes = result.recipes.filter(
				(recipe, index, self) =>
					self.findIndex((r) => r.url === recipe.url) === index &&
					!manuallyChosen.has(recipe.url),
			);
			setSuggestedRecipes(uniqueRecipes);
			setSuggestionReasoning(result.reasoning);
			setSelectedForPlan(new Set());
		} else if (allLikedRecipes.length > 0) {
			// Fallback: use liked recipes if AI suggestions failed
			const shuffled = [...allLikedRecipes]
				.filter((r) => !manuallyChosen.has(r.url))
				.sort(() => 0.5 - Math.random());
			setSuggestedRecipes(shuffled.slice(0, 10));
			setSuggestionReasoning(
				'Showing your liked recipes (AI suggestions unavailable)',
			);
			setSelectedForPlan(new Set());
		}
		setIsLoadingSuggestions(false);
	}, [user.id, selectedMoodTags, manuallyChosen, allLikedRecipes]);

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
		const chosenRecipes = allLikedRecipes.filter((r) =>
			manuallyChosen.has(r.url),
		);
		const aiSelectedRecipes = suggestedRecipes.filter((r) =>
			selectedForPlan.has(r.url),
		);
		const allRecipes = [...chosenRecipes];
		for (const r of aiSelectedRecipes) {
			if (!allRecipes.some((existing) => existing.url === r.url)) {
				allRecipes.push(r);
			}
		}
		setWeeklyRecipes(allRecipes);
		setViewMode('plan');
		resetWizard();
	}, [
		selectedForPlan,
		manuallyChosen,
		suggestedRecipes,
		allLikedRecipes,
		user.id,
		weekStart,
	]);

	// Handle removing a recipe from the plan
	const handleRemoveFromPlan = useCallback(
		async (recipeUrl: string) => {
			await removeRecipeFromWeeklyPlan(user.id, recipeUrl, weekStart);
			setWeeklyRecipes((prev) => prev.filter((r) => r.url !== recipeUrl));
		},
		[user.id, weekStart],
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
		[user.id],
	);

	// Open recipe dialog
	const openRecipeDialog = useCallback((recipe: Recipe) => {
		setDialogRecipe(recipe);
		setIsDialogOpen(true);
	}, []);

	// Close recipe dialog
	const closeRecipeDialog = useCallback(() => {
		setIsDialogOpen(false);
		setDialogRecipe(null);
	}, []);

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
	const getExpandedRowIndex = (
		recipes: Recipe[],
		url: string,
		columns: number,
	) => {
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
		} = {},
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
									onRemove={
										showRemove
											? () => handleRemoveFromPlan(recipe.url)
											: undefined
									}
									onClick={() =>
										setExpandedRecipeUrl(
											expandedRecipeUrl === recipe.url ? null : recipe.url,
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
		const aiSelected = suggestedRecipes.filter((r) =>
			selectedForPlan.has(r.url),
		);
		const all = [...chosen];
		for (const r of aiSelected) {
			if (!all.some((existing) => existing.url === r.url)) {
				all.push(r);
			}
		}
		return all;
	}, [allLikedRecipes, manuallyChosen, suggestedRecipes, selectedForPlan]);

	const totalSelected = manuallyChosen.size + selectedForPlan.size;

	// Calculate ingredient stats for the current selection
	const ingredientStats = useMemo(
		() => calculateIngredientStats(weeklyRecipes),
		[weeklyRecipes],
	);

	const selectedRecipesStats = useMemo(
		() => calculateIngredientStats(getSelectedRecipes()),
		[getSelectedRecipes],
	);

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<div className="flex items-center gap-3 mb-1">
							<h1 className="text-xl sm:text-2xl font-bold text-charcoal">
								Week of {format(weekStart, 'MMMM d')}
							</h1>
							{viewMode === 'plan' && weeklyRecipes.length > 0 && (
								<span className="px-2.5 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
									{weeklyRecipes.length} meal
									{weeklyRecipes.length !== 1 ? 's' : ''}
								</span>
							)}
						</div>
						{viewMode === 'plan' && weeklyRecipes.length > 0 && (
							<div className="mt-2">
								<div className="flex items-center gap-4 text-sm">
									<div className="flex items-center gap-1.5">
										<svg
											className="w-4 h-4 text-primary"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
											<line x1="3" y1="6" x2="21" y2="6" />
											<path d="M16 10a4 4 0 0 1-8 0" />
										</svg>
										<span className="text-charcoal font-medium">
											{ingredientStats.totalUniqueIngredients}
										</span>
										<span className="text-charcoal-muted">
											ingredients to buy
										</span>
									</div>
									{ingredientStats.overlappingIngredients.length > 0 && (
										<div className="flex items-center gap-1.5">
											<svg
												className="w-4 h-4 text-green-600"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<circle cx="9" cy="12" r="5" />
												<circle cx="15" cy="12" r="5" />
											</svg>
											<span className="text-green-600 font-medium">
												{ingredientStats.overlappingIngredients.length}
											</span>
											<span className="text-charcoal-muted">
												shared
											</span>
										</div>
									)}
								</div>
								{ingredientStats.overlappingIngredients.length > 0 && (
									<div className="mt-3">
										<button
											onClick={() => setIsSharedIngredientsExpanded(!isSharedIngredientsExpanded)}
											className="flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800 transition-colors"
										>
											<ChevronRight
												className={`w-4 h-4 transition-transform ${isSharedIngredientsExpanded ? 'rotate-90' : ''}`}
											/>
											<span>
												{ingredientStats.overlappingIngredients.length} shared ingredients save you trips to the store
											</span>
										</button>
										{isSharedIngredientsExpanded && (
											<div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
												<div className="space-y-2">
													{ingredientStats.overlappingIngredients.slice(0, 10).map((ing) => (
														<div
															key={ing.name}
															className="flex items-center justify-between py-1.5 px-3 bg-white rounded-md"
														>
															<span className="text-sm text-charcoal">{ing.name}</span>
															<span className="text-xs text-charcoal-muted">
																Used in {ing.count} recipes
															</span>
														</div>
													))}
													{ingredientStats.overlappingIngredients.length > 10 && (
														<p className="text-xs text-charcoal-muted text-center pt-2">
															+{ingredientStats.overlappingIngredients.length - 10} more shared ingredients
														</p>
													)}
												</div>
											</div>
										)}
									</div>
								)}
							</div>
						)}
						{viewMode === 'plan' && weeklyRecipes.length === 0 && (
							<p className="text-charcoal-muted text-sm">
								Plan your meals to get a smart grocery list
							</p>
						)}
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
			</div>

			{/* Current Plan View */}
			{viewMode === 'plan' && weeklyRecipes.length > 0 && (
				<div className="space-y-6">
					{/* This Week's Meals - Recipe cards with thumbnails */}
					<div className="bg-white rounded-xl p-4 sm:p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="font-semibold text-charcoal">
								This Week&apos;s Meals
							</h2>
							<button
								onClick={startWizard}
								className="text-sm text-primary hover:text-primary-dark transition-colors flex items-center gap-1 font-medium"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={2}
									stroke="currentColor"
									className="w-4 h-4"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M12 4.5v15m7.5-7.5h-15"
									/>
								</svg>
								Edit
							</button>
						</div>
						<div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
							{weeklyRecipes.map((recipe) => (
								<div
									key={recipe.url}
									className="flex-shrink-0 w-40 sm:w-48 cursor-pointer group"
									onClick={() => openRecipeDialog(recipe)}
								>
									<div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2">
										{recipe.image ? (
											<img
												src={recipe.image}
												alt={recipe.name || ''}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
											/>
										) : (
											<div className="w-full h-full bg-cream flex items-center justify-center">
												<svg
													className="w-8 h-8 text-charcoal-muted"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
													<line x1="6" y1="17" x2="18" y2="17" />
												</svg>
											</div>
										)}
										{/* Remove button overlay */}
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleRemoveFromPlan(recipe.url);
											}}
											className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full text-charcoal-muted hover:text-red-500 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
											title="Remove from plan"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth={2}
												stroke="currentColor"
												className="w-4 h-4"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</div>
									<p className="text-sm font-medium text-charcoal truncate group-hover:text-primary transition-colors">
										{recipe.name}
									</p>
									{recipe.cookTime && (
										<p className="text-xs text-charcoal-muted">
											{recipe.cookTime}
										</p>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Shopping List & Meal Prep - Side by side on desktop, stacked on mobile */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Shopping List Section - Collapsible on mobile */}
						<div>
							<button
								onClick={() => setIsShoppingExpanded(!isShoppingExpanded)}
								className="w-full flex items-center justify-between p-4 bg-white rounded-t-xl lg:hidden border-b border-cream-dark"
							>
								<span className="font-semibold text-charcoal">
									Shopping List
								</span>
								{isShoppingExpanded ? (
									<ChevronUp className="w-5 h-5 text-charcoal-muted" />
								) : (
									<ChevronDown className="w-5 h-5 text-charcoal-muted" />
								)}
							</button>
							<div
								className={`${
									isShoppingExpanded ? 'block' : 'hidden'
								} lg:block`}
							>
								<GroceryList
									recipes={weeklyRecipes}
									weeklyStaples={weeklyStaples}
								/>
							</div>
						</div>

						{/* Meal Prep Section - Collapsible on mobile */}
						<div>
							<button
								onClick={() => setIsPrepExpanded(!isPrepExpanded)}
								className="w-full flex items-center justify-between p-4 bg-white rounded-t-xl lg:hidden border-b border-cream-dark"
							>
								<span className="font-semibold text-charcoal">Meal Prep</span>
								{isPrepExpanded ? (
									<ChevronUp className="w-5 h-5 text-charcoal-muted" />
								) : (
									<ChevronDown className="w-5 h-5 text-charcoal-muted" />
								)}
							</button>
							<div
								className={`${isPrepExpanded ? 'block' : 'hidden'} lg:block`}
							>
								<MealPrepInstructions recipes={weeklyRecipes} />
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Recipe Dialog */}
			<RecipeDialog
				recipe={dialogRecipe}
				isOpen={isDialogOpen}
				onClose={closeRecipeDialog}
				isLiked={dialogRecipe ? likedUrls.has(dialogRecipe.url) : false}
				onLikeToggle={
					dialogRecipe ? () => handleLikeToggle(dialogRecipe.url) : undefined
				}
			/>

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
							<span className="text-sm text-charcoal-muted">
								Step {wizardStep} of 4
							</span>
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
								Select recipes you know you want to cook this week, or skip to
								get suggestions.
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
											Select recipes from your favorites ({manuallyChosen.size}{' '}
											selected)
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
									<div className="text-charcoal-muted">
										Loading your recipes...
									</div>
								</div>
							)}

							{!isLoadingLikedRecipes && allLikedRecipes.length === 0 && (
								<div className="text-center py-12 text-charcoal-muted">
									No liked recipes found. Browse recipes and add some favorites
									first.
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
													expandedRecipeUrl === recipe.url ? null : recipe.url,
												)
											}
											isExpanded={expandedRecipeUrl === recipe.url}
										/>
									))}
								</div>
							)}

							{!isLoadingLikedRecipes &&
								filteredRecipes.length === 0 &&
								allLikedRecipes.length > 0 && (
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
											Select all that apply - we&apos;ll suggest recipes that
											match
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
											{totalSelected} recipe{totalSelected !== 1 ? 's' : ''}{' '}
											selected
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
									<div className="text-charcoal-muted">
										Finding the perfect recipes...
									</div>
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

							{!isLoadingSuggestions &&
								suggestedRecipes.length === 0 &&
								manuallyChosen.size === 0 && (
									<div className="text-center py-12 text-charcoal-muted">
										No suggestions available. Try selecting different mood tags.
									</div>
								)}

							{/* Ingredient stats and grocery list preview */}
							{totalSelected > 0 && (
								<div className="space-y-4">
									{/* Stats Summary */}
									<div className="bg-white rounded-xl p-5 border border-cream-dark">
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
											<div>
												<h3 className="font-semibold text-charcoal mb-1">
													Your Selection Summary
												</h3>
												<p className="text-sm text-charcoal-muted">
													{totalSelected} recipe
													{totalSelected !== 1 ? 's' : ''} selected
												</p>
											</div>
											<div className="flex items-center gap-6">
												<div className="text-center">
													<div className="text-2xl font-bold text-primary">
														{selectedRecipesStats.totalUniqueIngredients}
													</div>
													<div className="text-xs text-charcoal-muted">
														Ingredients to buy
													</div>
												</div>
												<div className="text-center">
													<div className="text-2xl font-bold text-green-600">
														{selectedRecipesStats.overlappingIngredients.length}
													</div>
													<div className="text-xs text-charcoal-muted">
														Shared ingredients
													</div>
												</div>
												{selectedRecipesStats.overlappingIngredients.length >
													0 && (
													<div className="text-center">
														<div className="text-2xl font-bold text-blue-600">
															{selectedRecipesStats.estimatedSavings}
														</div>
														<div className="text-xs text-charcoal-muted">
															Less waste
														</div>
													</div>
												)}
											</div>
										</div>
										{selectedRecipesStats.overlappingIngredients.length > 0 && (
											<div className="mt-4 pt-4 border-t border-cream-dark">
												<p className="text-xs text-charcoal-muted mb-2">
													Shared ingredients:
												</p>
												<div className="flex flex-wrap gap-2">
													{selectedRecipesStats.overlappingIngredients
														.slice(0, 8)
														.map((ing) => (
															<span
																key={ing.name}
																className="px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full"
															>
																{ing.name} ({ing.count})
															</span>
														))}
													{selectedRecipesStats.overlappingIngredients.length >
														8 && (
														<span className="px-2.5 py-1 bg-cream text-charcoal-muted text-xs rounded-full">
															+
															{selectedRecipesStats.overlappingIngredients
																.length - 8}{' '}
															more
														</span>
													)}
												</div>
											</div>
										)}
									</div>

									{/* Grocery List Preview */}
									<div className="bg-cream-light rounded-xl p-6">
										<h3 className="section-header mb-4">
											Grocery List Preview
										</h3>
										<GroceryList
											recipes={getSelectedRecipes()}
											weeklyStaples={weeklyStaples}
										/>
									</div>
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
