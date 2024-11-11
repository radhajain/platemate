import { getUser } from '@/utilities/getUser';
import { redirect } from 'next/navigation';
import { login, signup } from './actions';

export default async function LoginPage() {
	const { isLoggedIn, user } = await getUser();
	if (isLoggedIn) {
		redirect(`/${user.id}`);
	}
	return (
		<form>
			<label htmlFor="email">Email:</label>
			<input id="email" name="email" type="email" required />
			<label htmlFor="password">Password:</label>
			<input id="password" name="password" type="password" required />
			<button formAction={login}>Log in</button>
			<button formAction={signup}>Sign up</button>
		</form>
	);
}
