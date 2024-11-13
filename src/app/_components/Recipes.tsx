'use client';
import { saveUserLikedRecipes } from '@/services/supabase/api';
import { useSet } from '@/utilities/hooks/useSet';
import { filterRecipesPrompt } from '@/utilities/prompts/filterRecipes';
import { Prompt } from '@/utilities/prompts/prompt';
import { User } from '@supabase/supabase-js';
import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Recipe } from '../../../database.types';

export default function LlmFilteredRecipes({
	recipes,
	user,
}: {
	recipes: readonly Recipe[];
	user: User | null;
}) {
	const [dietaryPreferences, setDietaryPreferences] = React.useState('');
	const prompt = filterRecipesPrompt(dietaryPreferences, recipes);
	const {
		mutate: handleSubmit,
		data: llmResult,
		isPending,
		isError,
	} = useMutation({
		mutationFn: async () => {
			// return llm(prompt);
			return recipes.slice(0, 16);
		},
	});
	return (
		<div>
			<div>{recipes.length} recipes available.</div>
			<input
				type="text"
				placeholder="What are your dietary preferences?"
				value={dietaryPreferences}
				onChange={(event) => setDietaryPreferences(event.target.value)}
			/>
			<button onClick={() => handleSubmit()}>Send</button>
			{isPending && <i>{Prompt.from(prompt)}</i>}
			{isPending && <div>Loading...</div>}
			{isError && <div>Error: {isError}</div>}
			{llmResult != null && (
				<RecipeSelector
					recipes={llmResult}
					initiallyLikedRecipeUrls={llmResult.map((recipe) => recipe.url)}
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
					JSON.stringify(likedRecipes.value)
				);
				router.push(`/login`);
			} else {
				await saveUserLikedRecipes(user, likedRecipes.value);
				router.push(`/${user.id}`);
			}
		},
	});
	return (
		<div className="flex flex-col gap-5">
			<ul className="grid w-full gap-6 md:grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 p-10">
				{recipes.map((recipe: Recipe) => (
					<li key={recipe.url}>
						<input
							type="checkbox"
							id={recipe.url}
							value=""
							checked={likedRecipes.value.has(recipe.url)}
							className="hidden peer"
							onChange={() => likedRecipes.toggle(recipe.url)}
						/>
						<RecipeDisplay recipe={recipe} />
					</li>
				))}
			</ul>
			<button onClick={() => handleSavePreferences()} disabled={isPending}>
				{isPending ? 'Loading...' : 'Save'}
			</button>
		</div>
	);
}

export function RecipeDisplay({ recipe }: { recipe: Recipe }) {
	return (
		<label
			htmlFor={recipe.url}
			className="inline-flex items-center justify-between w-full p-5 text-gray-500 bg-white border-2 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 peer-checked:border-blue-600 hover:text-gray-600 dark:peer-checked:text-gray-300 peer-checked:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
		>
			<div className="block">
				{recipe.image && (
					<Image
						src={recipe.image}
						alt={recipe.name ?? 'recipe'}
						height={100}
						width={100}
					/>
				)}
				<div className="w-full text-lg font-semibold">{recipe.name}</div>
			</div>
		</label>
	);
}
