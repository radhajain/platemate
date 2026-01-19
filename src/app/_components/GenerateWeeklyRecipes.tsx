'use client';

import { generateWeeklyRecipes } from '@/services/supabase/api';
import { createClient } from '@/services/supabase/client';
import { User } from '@supabase/supabase-js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek } from 'date-fns';
import { Recipe } from '../../../database.types';
import { Button } from './Button';
import { RecipeCard } from './Card';
import { GroceryList } from './GroceryList';

export function GenerateWeeklyRecipes({
	user,
	recipes,
}: {
	user: User;
	recipes: readonly Recipe[];
}) {
	const supabase = createClient();
	const queryClient = useQueryClient();
	const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

	const { mutate: generateWeek, isPending } = useMutation({
		mutationFn: async () => {
			await generateWeeklyRecipes(user.id, weekStart, supabase);
			// Refresh the page to get new recipes
			window.location.reload();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['structuredGroceryList'] });
		},
	});

	return (
		<div className="flex flex-col gap-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-charcoal">
						Week of {format(weekStart, 'MMMM d')}
					</h1>
					<p className="text-charcoal-muted">
						{recipes.length} meal{recipes.length !== 1 ? 's' : ''} planned
					</p>
				</div>
				<Button
					variant="primary-filled"
					onClick={() => generateWeek()}
					isLoading={isPending}
				>
					{recipes.length > 0 ? 'Regenerate Plan' : 'Generate Meal Plan'}
				</Button>
			</div>

			{recipes.length === 0 ? (
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
						Click the button above to generate a smart meal plan based on your
						favorite recipes.
					</p>
					<Button variant="primary-filled" onClick={() => generateWeek()}>
						Generate Meal Plan
					</Button>
				</div>
			) : (
				<div className="grid lg:grid-cols-2 gap-8">
					{/* Recipes Section */}
					<div>
						<h2 className="section-header mb-4">This Week&apos;s Recipes</h2>
						<div className="grid gap-4 sm:grid-cols-2">
							{recipes.map((recipe) => (
								<RecipeCard
									key={recipe.url}
									recipe={recipe}
									showSelectButton={false}
								/>
							))}
						</div>
					</div>

					{/* Grocery List Section */}
					<div>
						<h2 className="section-header mb-4">Shopping List</h2>
						<GroceryList recipes={recipes} />
					</div>
				</div>
			)}
		</div>
	);
}
