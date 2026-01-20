import { getUserProfile, getWeeklyRecipes } from '@/services/supabase/api';
import { getUser } from '@/utilities/getUser';
import { startOfWeek } from 'date-fns';
import { redirect } from 'next/navigation';
import { MealPlanDashboard } from '../_components/MealPlanDashboard';

export default async function UserMealPlan() {
	const { isLoggedIn, user } = await getUser();

	if (!isLoggedIn) {
		redirect('/login');
	}

	const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
	const [recipes, profile] = await Promise.all([
		getWeeklyRecipes(user.id, weekStart),
		getUserProfile(user.id),
	]);

	return (
		<MealPlanDashboard
			user={user}
			initialRecipes={recipes}
			weeklyStaples={profile?.weekly_staples || []}
		/>
	);
}
