import { createClient } from '@/services/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get('code');
	const next = searchParams.get('next') ?? '/';

	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			// Get the user to redirect to their dashboard
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (user) {
				return NextResponse.redirect(`${origin}/${user.id}`);
			}

			return NextResponse.redirect(`${origin}${next}`);
		}
	}

	// Return the user to an error page with instructions
	return NextResponse.redirect(`${origin}/error?message=Could not authenticate user`);
}
