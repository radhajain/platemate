import { createClient } from '@/services/supabase/server';
import { getUser } from '@/utilities/getUser';
import { redirect } from 'next/navigation';
import { Recipe } from '../../../database.types';
import { GenerateWeeklyRecipes } from '../_components/GenerateWeeklyRecipes';

export default async function UserProfile() {
	const supabase = await createClient();
	const { isLoggedIn, user } = await getUser();
	if (!isLoggedIn) {
		redirect('/login');
	}
	const userWeeklyRecipesQuery = supabase.from('weekly_user_recipes').select(`
    recipes (*)
  `);
	const { data, error } = await userWeeklyRecipesQuery;
	if (error) {
		redirect('/error');
	}
	const recipes: readonly Recipe[] = data.flatMap(({ recipes }) => recipes);
	return (
		<div>
			<p>Hello {user.email}</p>
			<GenerateWeeklyRecipes user={user} recipes={recipes} />
		</div>
	);
}
