import { getUser } from '@/utilities/getUser';
import { redirect } from 'next/navigation';
import LoginForm from '../_components/LoginForm';

export default async function LoginPage() {
	const { isLoggedIn, user } = await getUser();
	if (isLoggedIn) {
		redirect(`/${user.id}`);
	}
	return <LoginForm />;
}
