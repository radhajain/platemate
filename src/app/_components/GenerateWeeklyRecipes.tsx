'use client';

import { generateWeeklyRecipes } from '@/services/supabase/api';
import { createClient } from '@/services/supabase/client';
import { llm } from '@/utilities/llm';
import { dedupeGroceryList } from '@/utilities/prompts/dedupeGroceryList';
import { User } from '@supabase/supabase-js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { startOfWeek } from 'date-fns';
import { Recipe } from '../../../database.types';
import { RecipeDisplay } from './Recipes';

export function GenerateWeeklyRecipes({
	user,
	recipes,
}: {
	user: User;
	recipes: readonly Recipe[];
}) {
	const supabase = createClient();
	const { mutate: generateWeek, isPending } = useMutation({
		mutationFn: async () => {
			await generateWeeklyRecipes(
				user.id,
				startOfWeek(new Date(), { weekStartsOn: 1 }),
				supabase
			);
		},
	});
	const {
		data: dedupedIngredients,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['dedupedIngredients', recipes],
		queryFn: async () => {
			return await llm(dedupeGroceryList(recipes));
		},
		enabled: recipes.length > 0,
	});

	return (
		<div className="flex flex-col">
			<div className="flex justify-between gap-5">
				<div>This week</div>
				<button onClick={() => generateWeek()} disabled={isPending}>
					{isPending ? 'Loading...' : 'Generate'}
				</button>
			</div>
			<div className="flex gap-5">
				<div className="flex flex-col gap-5">
					<div>Grocery list</div>
					<div>
						{recipes.map(({ url, ingredients }) =>
							ingredients == null ? null : (
								<div key={url}>
									{ingredients.map((ingredient, index) => (
										<div key={index}>{ingredient}</div>
									))}
								</div>
							)
						)}
					</div>
					{isError && <div>Error creating grocery list</div>}
					{isLoading && <div>Loading</div>}
					{dedupedIngredients != null && (
						<div>
							{dedupedIngredients.split(', ').map((ingredient) => (
								<div key={ingredient}>{ingredient}</div>
							))}
						</div>
					)}
				</div>
				<div className="flex flex-col gap-5">
					<div>Recipes</div>
					<div>
						{recipes.map((recipe) => (
							<RecipeDisplay key={recipe.url} recipe={recipe} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
