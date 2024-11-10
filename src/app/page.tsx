import * as React from 'react';
import { getAllRecipes } from '../../public/scripts.ts/love-and-lemons';
import Recipes from './[components]/Recipes';

const fetchRecipesCached = React.cache(getAllRecipes);

export default async function Home() {
	const allRecipeUrl = 'https://www.loveandlemons.com/easy-dinner-ideas/';
	const recipes = await fetchRecipesCached(allRecipeUrl);
	return <Recipes recipes={recipes} />;
}
