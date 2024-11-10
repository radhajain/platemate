'use client';
import { createRecipePrompt } from '@/utilities/prompts';
import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import * as React from 'react';
import { Recipe } from '../../../public/scripts.ts/love-and-lemons';

export default function Recipes({ recipes }: { recipes: Recipe[] }) {
	const [dietaryPreferences, setDietaryPreferences] = React.useState('');
	const prompt = createRecipePrompt(dietaryPreferences, recipes);
	const {
		mutate: handleSubmit,
		data: llmResult,
		isPending,
		isError,
	} = useMutation({
		mutationFn: async () => {
			// return llm(prompt);
			return recipes.slice(0, 4);
		},
	});
	return (
		<>
			<div>{recipes.length} recipes available.</div>
			<input
				type="text"
				placeholder="What are your dietary preferences?"
				value={dietaryPreferences}
				onChange={(event) => setDietaryPreferences(event.target.value)}
			/>
			<button onClick={() => handleSubmit()}>Send</button>
			{isPending && <i>{prompt}</i>}
			{isPending && <div>Loading...</div>}
			{isError && <div>Error: {isError}</div>}
			{llmResult != null && (
				<div>
					{llmResult.map((recipe: Recipe) => (
						<div key={recipe.name}>
							<Image
								src={recipe.image}
								alt={recipe.name}
								height={100}
								width={100}
							/>
							<span>{recipe.name}</span>
						</div>
					))}
				</div>
			)}
		</>
	);
}
