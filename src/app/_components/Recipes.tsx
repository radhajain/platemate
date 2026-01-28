'use client';
import { saveUserLikedRecipes } from '@/services/supabase/api';
import { useSet } from '@/utilities/hooks/useSet';
import { User } from '@supabase/supabase-js';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Recipe } from '../../../database.types';
import { Button } from './Button';
import { RecipeCard } from './Card';

export default function LlmFilteredRecipes({
	recipes,
	user,
}: {
	recipes: readonly Recipe[];
	user: User | null;
}) {
	const [dietaryPreferences, setDietaryPreferences] = React.useState('');
	const {
		mutate: handleSubmit,
		data: llmResult,
		isPending,
		isError,
	} = useMutation({
		mutationFn: async () => {
			// TODO: Use Claude API to filter recipes by dietary preferences
			return recipes.slice(0, 16);
		},
	});

	return (
		<div className="flex flex-col gap-8">
			<div className="bg-white rounded-xl p-4 sm:p-6">
				<h2 className="text-lg sm:text-xl font-semibold text-charcoal mb-3 sm:mb-4">
					Tell us your preferences
				</h2>
				<p className="text-charcoal-muted mb-4 text-sm sm:text-base">
					{recipes.length} recipes available. Describe your dietary preferences
					and we will show you matching recipes.
				</p>
				<div className="flex flex-col sm:flex-row gap-3">
					<input
						type="text"
						placeholder="e.g., vegetarian, gluten-free, low-carb..."
						value={dietaryPreferences}
						onChange={(event) => setDietaryPreferences(event.target.value)}
						className="flex-1 px-4 py-2.5 border-2 border-cream-dark rounded-lg focus:border-primary focus:outline-none transition-colors"
					/>
					<Button
						variant="primary-filled"
						onClick={() => handleSubmit()}
						isLoading={isPending}
					>
						Find Recipes
					</Button>
				</div>
				{isError && (
					<p className="mt-3 text-red-500 text-sm">
						Something went wrong. Please try again.
					</p>
				)}
			</div>

			{llmResult != null && (
				<RecipeSelector
					recipes={llmResult}
					initiallyLikedRecipeUrls={[]}
					user={user}
				/>
			)}
		</div>
	);
}

export function RecipeSelector({
	recipes,
	initiallyLikedRecipeUrls,
	user,
}: {
	recipes: readonly Recipe[];
	initiallyLikedRecipeUrls: string[];
	user: User | null;
}) {
	const likedRecipes = useSet(initiallyLikedRecipeUrls);
	const router = useRouter();
	const { mutate: handleSavePreferences, isPending } = useMutation({
		mutationFn: async () => {
			if (user == null) {
				localStorage.setItem(
					'likedRecipesResults',
					JSON.stringify(Array.from(likedRecipes.value)),
				);
				router.push(`/login`);
			} else {
				await saveUserLikedRecipes(user, likedRecipes.value);
				router.push(`/${user.id}`);
			}
		},
	});

	const selectedCount = likedRecipes.value.size;
	const allSelected = selectedCount === recipes.length && recipes.length > 0;

	const handleSelectAll = () => {
		if (allSelected) {
			// Deselect all
			recipes.forEach((recipe) => {
				if (likedRecipes.value.has(recipe.url)) {
					likedRecipes.toggle(recipe.url);
				}
			});
		} else {
			// Select all
			recipes.forEach((recipe) => {
				if (!likedRecipes.value.has(recipe.url)) {
					likedRecipes.toggle(recipe.url);
				}
			});
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-lg sm:text-xl font-semibold text-charcoal">
						Select Your Favorites
					</h2>
					<p className="text-charcoal-muted text-sm sm:text-base">
						{selectedCount} recipe{selectedCount !== 1 ? 's' : ''} selected
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={handleSelectAll}
						className="text-sm text-primary hover:text-primary-dark transition-colors"
					>
						{allSelected ? 'Deselect All' : 'Select All'}
					</button>
					<Button
						variant="primary-filled"
						onClick={() => handleSavePreferences()}
						isLoading={isPending}
						disabled={selectedCount === 0}
					>
						<span className="hidden sm:inline">Save & Continue</span>
						<span className="sm:hidden">Save</span>
					</Button>
				</div>
			</div>

			<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{recipes.map((recipe: Recipe) => (
					<RecipeCard
						key={recipe.url}
						recipe={recipe}
						isSelected={likedRecipes.value.has(recipe.url)}
						onSelect={() => likedRecipes.toggle(recipe.url)}
					/>
				))}
			</div>

			{selectedCount > 0 && (
				<div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 bg-white shadow-lg rounded-full px-4 sm:px-6 py-3 flex items-center justify-between sm:justify-start gap-4 border border-cream-dark z-40">
					<span className="text-charcoal text-sm sm:text-base">
						{selectedCount} recipe{selectedCount !== 1 ? 's' : ''} selected
					</span>
					<Button
						variant="primary-filled"
						onClick={() => handleSavePreferences()}
						isLoading={isPending}
					>
						<span className="hidden sm:inline">Save & Continue</span>
						<span className="sm:hidden">Save</span>
					</Button>
				</div>
			)}
		</div>
	);
}

export function RecipeDisplay({ recipe }: { recipe: Recipe }) {
	return <RecipeCard recipe={recipe} showSelectButton={false} />;
}
