import { Recipe } from '../../../public/scripts.ts/love-and-lemons';

export default function Recipes({ recipes }: { recipes: Recipe[] }) {
	return (
		<div>
			The following recipes were scraped:
			{recipes.map((recipe) => (
				<div key={recipe.name}>{recipe.name}</div>
			))}
		</div>
	);
}
