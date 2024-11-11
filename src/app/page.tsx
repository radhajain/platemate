import { createSupabaseClient } from '@/services/supabase/server';
import LlmFilteredRecipes from './_components/Recipes';
import Link from 'next/link';

export default async function Home() {
	const supabase = await createSupabaseClient();
	// TODO: types
	const { data, error } = await supabase.from('recipes').select('*');
	return (
		<div className="flex p-5 w-full">
			<div className="justify-center w-full">
				{error != null ? (
					<div>Error loading recipes</div>
				) : (
					<LlmFilteredRecipes recipes={data} />
				)}
			</div>
			<Link href="/username">Go to profile</Link>
		</div>
	);
}
