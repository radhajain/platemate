import { createClient } from '@/services/supabase/server';
import { getUser } from '@/utilities/getUser';
import LlmFilteredRecipes from '../_components/Recipes';
import { redirect } from 'next/navigation';

export default async function Page() {
	const supabase = await createClient();
	const { data, error } = await supabase.from('recipes').select('*');
	const { isLoggedIn, user } = await getUser();
	if (error) {
		redirect('/error');
	}
	return (
		<div className="w-full">
			<LlmFilteredRecipes recipes={data} user={isLoggedIn ? user : null} />
		</div>
	);
}
