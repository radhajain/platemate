import { createClient } from '@/services/supabase/server';
import Link from 'next/link';
import { RecipeCard } from '../_components/Card';

export default async function RecipesPage() {
	const supabase = await createClient();

	const { data: recipes, error } = await supabase
		.from('recipes')
		.select('*')
		.order('name');

	if (error) {
		console.error('Error fetching recipes:', error);
	}

	return (
		<div className="flex flex-col gap-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-charcoal">All Recipes</h1>
					<p className="text-charcoal-muted">
						{recipes?.length || 0} recipes available
					</p>
				</div>
				<Link
					href="/recipes/add"
					className="btn-primary-filled"
				>
					Add Recipe
				</Link>
			</div>

			{/* Recipe Grid */}
			{recipes && recipes.length > 0 ? (
				<div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{recipes.map((recipe) => (
						<RecipeCard
							key={recipe.url}
							recipe={recipe}
							showSelectButton={false}
						/>
					))}
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
					<Link
						href="/recipes/add"
						className="btn-primary-filled inline-block"
					>
						Add Your First Recipe
					</Link>
				</div>
			)}
		</div>
	);
}
