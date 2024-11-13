'use server';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from './server';

export async function generateWeeklyRecipes(
	userId: User['id'],
	weekStartDate: Date,
	supabase: SupabaseClient
) {
	const { data: likedRecipes, error } = await supabase
		.from('user_liked_recipes')
		.select('*');
	if (error) {
		console.error('Error getting data:', error);
		return;
	}
	const rand = randomIntFromInterval(0, likedRecipes.length - 3);
	const weeklyRecipes = likedRecipes
		.slice(rand, rand + 2)
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

// min and max included
function randomIntFromInterval(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export async function saveUserLikedRecipes(
	user: User,
	likedRecipeUrls: Set<string>
) {
	const supabase = await createClient();
	const { error } = await supabase.from('user_liked_recipes').insert(
		Array.from(likedRecipeUrls).map((url) => ({
			user_id: user.id,
			recipe_url: url,
		}))
	);
	if (error) {
		console.error('Error inserting data:', error);
	} else {
		console.log('Data inserted successfully');
		// router.push(`/${user.id}`);
	}
}
