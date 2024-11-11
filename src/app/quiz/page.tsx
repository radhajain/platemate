import { createClient } from '@/services/supabase/server';
import { getUser } from '@/utilities/getUser';
import LlmFilteredRecipes from '../_components/Recipes';

export default async function Page() {
	const supabase = await createClient();
	// TODO: types
	const { data, error } = await supabase.from('recipes').select('*');
	const { isLoggedIn, user } = await getUser();

	return (
		<div className="flex p-5 w-full">
			<div className="justify-center w-full">
				{error != null ? (
					<div>Error loading recipes</div>
				) : (
					<div>
						<LlmFilteredRecipes
							recipes={data}
							user={isLoggedIn ? user : null}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
