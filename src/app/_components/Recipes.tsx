'use client';
import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import * as React from 'react';
import { Recipe } from '../../services/scraping/love-and-lemons';
import { filterRecipesPrompt } from '@/utilities/prompts/filterRecipes';
import { Prompt } from '@/utilities/prompts/prompt';
import { useSet } from '@/utilities/hooks/useSet';

export default function LlmFilteredRecipes({ recipes }: { recipes: Recipe[] }) {
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
			{llmResult != null && <RecipeSelector recipes={llmResult} />}
		</div>
	);
}

function RecipeSelector({ recipes }: { recipes: readonly Recipe[] }) {
	const likedRecipes = useSet(recipes.map((recipe) => recipe.url));
	return (
		<ul className="grid w-full gap-6 md:grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 p-10">
			{recipes.map((recipe: Recipe) => (
				<li key={recipe.url}>
					<input
						type="checkbox"
						id={recipe.url}
						value=""
						checked={likedRecipes.value.has(recipe.url)}
						className="hidden peer"
						onClick={() => likedRecipes.toggle(recipe.url)}
					/>
					<label
						htmlFor={recipe.url}
						className="inline-flex items-center justify-between w-full p-5 text-gray-500 bg-white border-2 border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 peer-checked:border-blue-600 hover:text-gray-600 dark:peer-checked:text-gray-300 peer-checked:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
					>
						<div className="block">
							{recipe.image && (
								<Image
									src={recipe.image}
									alt={recipe.name}
									height={100}
									width={100}
								/>
							)}
							<div className="w-full text-lg font-semibold">{recipe.name}</div>
						</div>
					</label>
				</li>
			))}
		</ul>
	);
}
