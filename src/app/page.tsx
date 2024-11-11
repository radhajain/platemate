import { createSupabaseClient } from '@/services/supabase/server';
import Recipes from './[components]/Recipes';

export default async function Home() {
	const supabase = await createSupabaseClient();
	// TODO: types
	const { data, error } = await supabase.from('recipes').select('*');
	return error != null ? (
		<div>Error loading recipes</div>
	) : (
		<Recipes recipes={data} />
	);
}
