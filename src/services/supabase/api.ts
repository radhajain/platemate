import { User } from '@supabase/supabase-js';
import { createClient } from './server';

export async function generateWeeklyRecipes(
	userId: User['id'],
	weekStartDate: Date
) {
	const supabase = await createClient();
	const { data: likedRecipes, error } = await supabase
		.from('user_liked_recipes')
		.select('*');
	if (error) {
		console.error('Error getting data:', error);
		return;
	}
	const weeklyRecipes = likedRecipes
		.slice(0, 3)
		.map(({ recipe_url }) => recipe_url);
	const { data, error: insertError } = await supabase
		.from('weekly_user_recipes')
		.insert(
			weeklyRecipes.map((url) => ({
				user_id: userId,
				recipe_url: url,
				week_start_date: weekStartDate,
			}))
		)
		.select('*');
	if (insertError) {
		console.error('Error inserting weekly recipes:', error);
	} else {
		console.log('Data inserted successfully');
	}
	return data;
}
