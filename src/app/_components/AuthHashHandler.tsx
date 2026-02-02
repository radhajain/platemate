'use client';

import { createClient } from '@/services/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthHashHandler() {
	const router = useRouter();
	const supabase = createClient();

	useEffect(() => {
		// Check if there's an access_token in the URL hash (magic link or recovery)
		const hashParams = new URLSearchParams(
			window.location.hash.substring(1)
		);
		const accessToken = hashParams.get('access_token');
		const refreshToken = hashParams.get('refresh_token');
		const type = hashParams.get('type');

		if (accessToken && refreshToken && (type === 'magiclink' || type === 'recovery')) {
			// Set the session from the hash tokens
			supabase.auth
				.setSession({
					access_token: accessToken,
					refresh_token: refreshToken,
				})
				.then(({ data, error }) => {
					if (error) {
						console.error('Error setting session:', error);
						router.push('/login?error=auth_failed');
						return;
					}

					if (data.user) {
						// Clear the hash from the URL
						window.history.replaceState(
							null,
							'',
							window.location.pathname
						);

						// Handle password recovery - redirect to update password page
						if (type === 'recovery') {
							router.push('/update-password');
							router.refresh();
							return;
						}

						// Handle magic link - regular sign in flow
						// Handle quiz results if they exist in localStorage
						const quizResults = localStorage.getItem('likedRecipesResults');
						if (quizResults) {
							try {
								const likedRecipes = JSON.parse(quizResults);
								if (Array.isArray(likedRecipes) && likedRecipes.length > 0) {
									fetch('/api/save-quiz-results', {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({ urls: likedRecipes }),
									}).then(() => {
										localStorage.removeItem('likedRecipesResults');
									});
								}
							} catch {
								// Ignore parse errors
							}
						}

						// Redirect to user's dashboard
						router.push(`/${data.user.id}`);
						router.refresh();
					}
				});
		}
	}, [supabase, router]);

	return null;
}
