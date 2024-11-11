import { createClient } from '@/services/supabase/server';
import { getUser } from '@/utilities/getUser';
import { redirect } from 'next/navigation';

export default async function Page() {
	const supabase = await createClient();
	const { data: likedRecipes, error: likedRecipesError } = await supabase
		.from('user_liked_recipes')
		.select('recipe_url');

	const { isLoggedIn, user } = await getUser();
	if (!isLoggedIn) {
		redirect('/login');
	}
	return (
		<div className="flex p-5 w-full">
			<div className="justify-center w-full">
				<div>Liked recipes</div>
				{likedRecipesError != null ? (
					<div>Error loading recipes</div>
				) : (
					<div>
						{likedRecipes?.map(({ recipe_url }) => (
							<div>{recipe_url}</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
