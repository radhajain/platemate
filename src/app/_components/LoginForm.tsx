'use client';

import { createClient } from '@/services/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginForm() {
	const supabase = createClient();
	const router = useRouter();

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_IN' && session?.user) {
				// Handle quiz results if they exist in localStorage
				const quizResults = localStorage.getItem('likedRecipesResults');
				if (quizResults) {
					try {
						const likedRecipes = JSON.parse(quizResults);
						if (Array.isArray(likedRecipes) && likedRecipes.length > 0) {
							// Save quiz results via API
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
				router.push(`/${session.user.id}`);
				router.refresh();
			}
		});

		return () => subscription.unsubscribe();
	}, [supabase, router]);

	return (
		<div className="flex items-center justify-center bg-cream -my-8 min-h-[calc(100vh-8rem)]">
			<div className="w-full max-w-md">
				<div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
					<div className="text-center mb-6 sm:mb-8">
						<h1 className="text-xl sm:text-2xl font-semibold text-charcoal mb-2">
							Welcome to Plate Mate
						</h1>
						<p className="text-charcoal-muted text-sm">
							Sign in to continue to your meal planner
						</p>
					</div>

					<Auth
						supabaseClient={supabase}
						appearance={{
							theme: ThemeSupa,
							variables: {
								default: {
									colors: {
										brand: '#22c55e',
										brandAccent: '#16a34a',
										brandButtonText: 'white',
										inputBackground: '#fafaf9',
										inputBorder: '#e7e5e4',
										inputBorderFocus: '#22c55e',
										inputBorderHover: '#22c55e',
										inputText: '#1c1917',
										inputPlaceholder: '#78716c',
									},
									borderWidths: {
										buttonBorderWidth: '2px',
										inputBorderWidth: '1px',
									},
									radii: {
										borderRadiusButton: '9999px',
										buttonBorderRadius: '9999px',
										inputBorderRadius: '0.5rem',
									},
									fontSizes: {
										baseBodySize: '14px',
										baseInputSize: '14px',
										baseLabelSize: '14px',
										baseButtonSize: '14px',
									},
									fonts: {
										bodyFontFamily:
											'var(--font-geist-sans), system-ui, sans-serif',
										buttonFontFamily:
											'var(--font-geist-sans), system-ui, sans-serif',
										inputFontFamily:
											'var(--font-geist-sans), system-ui, sans-serif',
										labelFontFamily:
											'var(--font-geist-sans), system-ui, sans-serif',
									},
								},
							},
							style: {
								button: {
									fontWeight: '500',
									textTransform: 'uppercase',
									letterSpacing: '0.1em',
									padding: '12px 24px',
								},
								input: {
									padding: '12px 16px',
								},
								label: {
									color: '#1c1917',
									fontWeight: '500',
									marginBottom: '6px',
								},
								anchor: {
									color: '#22c55e',
									fontWeight: '500',
								},
								message: {
									color: '#dc2626',
									fontSize: '14px',
								},
							},
						}}
						providers={[]}
						redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
						view="sign_in"
						showLinks={true}
						localization={{
							variables: {
								sign_in: {
									email_label: 'Email',
									password_label: 'Password',
									email_input_placeholder: 'you@example.com',
									password_input_placeholder: 'Enter your password',
									button_label: 'Sign In',
									link_text: "Don't have an account? Sign up",
								},
								sign_up: {
									email_label: 'Email',
									password_label: 'Password',
									email_input_placeholder: 'you@example.com',
									password_input_placeholder:
										'Create a password (min 6 characters)',
									button_label: 'Sign Up',
									link_text: 'Already have an account? Sign in',
									confirmation_text:
										'Check your email for the confirmation link',
								},
								forgotten_password: {
									email_label: 'Email',
									email_input_placeholder: 'you@example.com',
									button_label: 'Send Reset Instructions',
									link_text: 'Back to sign in',
								},
							},
						}}
					/>
				</div>

				<p className="text-center text-charcoal-muted text-sm mt-6">
					By continuing, you agree to our Terms of Service
				</p>
			</div>
		</div>
	);
}
