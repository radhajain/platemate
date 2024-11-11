import { createSupabaseClient } from '../supabase/server';
import { LoveAndLemons, Recipe } from './love-and-lemons';

interface ScrapingService {
	fetchAllRecipes: () => Promise<readonly Recipe[]>;
	uploadRecipesToDatabase: (recipes: readonly Recipe[]) => Promise<void>;
}

export const scrapingService: ScrapingService = {
	fetchAllRecipes: async (): Promise<readonly Recipe[]> => {
		try {
			return await LoveAndLemons.getAllRecipes();
		} catch (error) {
			console.error('Error fetching recipes:', error);
			throw error;
		}
	},
	uploadRecipesToDatabase: async (recipes: readonly Recipe[]) => {
		try {
			const supabase = await createSupabaseClient();
			const { error } = await supabase
				.from('recipes')
				.upsert(recipes, { onConflict: 'url', ignoreDuplicates: true });
			if (error) {
				console.error('Error inserting data:', error);
			} else {
				console.log('Data inserted successfully');
			}
		} catch (error) {
			console.error('Error uploading recipes:', error);
			throw error;
		}
	},
};
