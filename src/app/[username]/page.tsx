import { createClient } from '@/services/supabase/server';
import { getUser } from '@/utilities/getUser';
import { redirect } from 'next/navigation';

type UserProfileProps = {
	params: { username: string };
};

export default async function UserProfile({ params }: UserProfileProps) {
	const supabase = await createClient();
	const { isLoggedIn, user } = await getUser();
	if (!isLoggedIn) {
		redirect('/login');
	}
	const { data: recipes, error } = await supabase
		.from('weekly_user_recipes')
		.select('*');

	return (
		<div>
			<p>Hello {user.email}</p>
			<div>This week</div>
			<div className="flex gap-5">
				<div>Grocery list</div>
				<div>Recipes</div>
				{error != null ? (
					<div>Error loading recipes</div>
				) : (
					<div>{recipes}</div>
				)}
			</div>
		</div>
	);
}
