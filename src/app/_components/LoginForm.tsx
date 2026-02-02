'use client';

import { createClient } from '@/services/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type AuthView = 'sign_in' | 'sign_up' | 'forgot_password';

export default function LoginForm() {
	const supabase = createClient();
	const router = useRouter();
	const [view, setView] = useState<AuthView>('sign_in');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

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

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			setError(getErrorMessage(error.message));
			setLoading(false);
		}
	};

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${window.location.origin}/auth/callback`,
			},
		});

		if (error) {
			setError(getErrorMessage(error.message));
			setLoading(false);
		} else {
			setMessage('Check your email for the confirmation link');
			setLoading(false);
		}
	};

	const handleForgotPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: window.location.origin,
		});

		if (error) {
			setError(getErrorMessage(error.message));
		} else {
			setMessage('Check your email for the password reset link');
		}
		setLoading(false);
	};

	const getErrorMessage = (message: string): string => {
		if (message.includes('Invalid login credentials')) {
			return 'Invalid email or password. Please try again.';
		}
		if (message.includes('Email not confirmed')) {
			return 'Please check your email and confirm your account.';
		}
		if (message.includes('User already registered')) {
			return 'An account with this email already exists.';
		}
		if (message.includes('Password should be')) {
			return 'Password must be at least 6 characters long.';
		}
		return message;
	};

	const switchView = (newView: AuthView) => {
		setView(newView);
		setError(null);
		setMessage(null);
	};

	const inputClassName =
		'w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-500 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500';

	const buttonClassName =
		'w-full py-3 px-6 bg-green-500 hover:bg-green-600 text-white font-medium text-sm uppercase tracking-wider rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

	const linkClassName =
		'text-green-500 font-medium hover:text-green-600 transition-colors';

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

					{error && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
							{error}
						</div>
					)}

					{message && (
						<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
							{message}
						</div>
					)}

					{view === 'sign_in' && (
						<form onSubmit={handleSignIn} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-stone-900 mb-1.5">
									Email
								</label>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com"
									required
									className={inputClassName}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-stone-900 mb-1.5">
									Password
								</label>
								<input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter your password"
									required
									className={inputClassName}
								/>
							</div>
							<button type="submit" disabled={loading} className={buttonClassName}>
								{loading ? 'Signing in...' : 'Sign In'}
							</button>
							<div className="text-center space-y-2 pt-2">
								<button
									type="button"
									onClick={() => switchView('forgot_password')}
									className={linkClassName}
								>
									Forgot your password?
								</button>
								<div>
									<button
										type="button"
										onClick={() => switchView('sign_up')}
										className={linkClassName}
									>
										Don&apos;t have an account? Sign up
									</button>
								</div>
							</div>
						</form>
					)}

					{view === 'sign_up' && (
						<form onSubmit={handleSignUp} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-stone-900 mb-1.5">
									Email
								</label>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com"
									required
									className={inputClassName}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-stone-900 mb-1.5">
									Password
								</label>
								<input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Create a password (min 6 characters)"
									required
									minLength={6}
									className={inputClassName}
								/>
							</div>
							<button type="submit" disabled={loading} className={buttonClassName}>
								{loading ? 'Creating account...' : 'Sign Up'}
							</button>
							<div className="text-center pt-2">
								<button
									type="button"
									onClick={() => switchView('sign_in')}
									className={linkClassName}
								>
									Already have an account? Sign in
								</button>
							</div>
						</form>
					)}

					{view === 'forgot_password' && (
						<form onSubmit={handleForgotPassword} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-stone-900 mb-1.5">
									Email
								</label>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com"
									required
									className={inputClassName}
								/>
							</div>
							<button type="submit" disabled={loading} className={buttonClassName}>
								{loading ? 'Sending...' : 'Send Reset Instructions'}
							</button>
							<div className="text-center pt-2">
								<button
									type="button"
									onClick={() => switchView('sign_in')}
									className={linkClassName}
								>
									Back to sign in
								</button>
							</div>
						</form>
					)}
				</div>

				<p className="text-center text-charcoal-muted text-sm mt-6">
					By continuing, you agree to our Terms of Service
				</p>
			</div>
		</div>
	);
}
