import { createClient } from '@/services/supabase/server';
import { User } from '@supabase/auth-js';

export type GetUserReturn =
	| { isLoggedIn: true; user: User }
	| { isLoggedIn: false; user: null };
export async function getUser(): Promise<GetUserReturn> {
	const supabase = await createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();
	if (authError == null && user != null) {
		return { isLoggedIn: true, user };
	} else {
		return { isLoggedIn: false, user: null };
	}
}
