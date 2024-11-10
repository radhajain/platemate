import * as React from 'react';
import { getAllRecipes } from '../../public/scripts.ts/love-and-lemons';
import Recipes from './landing/page';

const fetchRecipesCached = React.cache(getAllRecipes);

export default async function Home() {
	const allRecipeUrl = 'https://www.loveandlemons.com/easy-dinner-ideas/';
	const recipes = await fetchRecipesCached(allRecipeUrl);
	return (
		<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
				<Recipes recipes={recipes} />
			</main>
		</div>
	);
}
