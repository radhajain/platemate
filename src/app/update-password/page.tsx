'use client';

import { createClient } from '@/services/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UpdatePasswordPage() {
	const supabase = createClient();
	const router = useRouter();
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

	useEffect(() => {
		// Check if user has a valid session (from the recovery link)
		const checkSession = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			setIsAuthenticated(!!session);

			if (!session) {
				setError(
					'Invalid or expired password reset link. Please request a new one.'
				);
			}
		};

		checkSession();
	}, [supabase]);

	const handleUpdatePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		if (password !== confirmPassword) {
			setError('Passwords do not match.');
			setLoading(false);
			return;
		}

		if (password.length < 6) {
			setError('Password must be at least 6 characters long.');
			setLoading(false);
			return;
		}

		const { error } = await supabase.auth.updateUser({ password });

		if (error) {
			setError(error.message);
			setLoading(false);
		} else {
			setMessage('Password updated successfully! Redirecting to login...');
			setLoading(false);
			// Sign out and redirect to login
			await supabase.auth.signOut();
			setTimeout(() => {
				router.push('/login');
			}, 2000);
		}
	};

	const inputClassName =
		'w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-500 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500';

	const buttonClassName =
		'w-full py-3 px-6 bg-green-500 hover:bg-green-600 text-white font-medium text-sm uppercase tracking-wider rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

	const linkClassName =
		'text-green-500 font-medium hover:text-green-600 transition-colors';

	// Show loading state while checking authentication
	if (isAuthenticated === null) {
		return (
			<div className="flex items-center justify-center bg-cream -my-8 min-h-[calc(100vh-8rem)]">
				<div className="w-full max-w-md">
					<div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
						<p className="text-charcoal-muted">Loading...</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center bg-cream -my-8 min-h-[calc(100vh-8rem)]">
			<div className="w-full max-w-md">
				<div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
					<div className="text-center mb-6 sm:mb-8">
						<h1 className="text-xl sm:text-2xl font-semibold text-charcoal mb-2">
							Update Your Password
						</h1>
						<p className="text-charcoal-muted text-sm">
							Enter your new password below
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

					{isAuthenticated ? (
						<form onSubmit={handleUpdatePassword} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-stone-900 mb-1.5">
									New Password
								</label>
								<input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter new password (min 6 characters)"
									required
									minLength={6}
									className={inputClassName}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-stone-900 mb-1.5">
									Confirm Password
								</label>
								<input
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="Confirm your new password"
									required
									minLength={6}
									className={inputClassName}
								/>
							</div>
							<button
								type="submit"
								disabled={loading}
								className={buttonClassName}
							>
								{loading ? 'Updating...' : 'Update Password'}
							</button>
						</form>
					) : (
						<div className="text-center">
							<button
								onClick={() => router.push('/login')}
								className={linkClassName}
							>
								Back to sign in
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
