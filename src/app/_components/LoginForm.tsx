'use client';

import { FormEvent, useState } from 'react';
import { login, saveQuizResultsForUser, signup } from '../login/actions';

export default function LoginForm() {
	const [errors, setErrors] = useState({
		email: '',
		password: '',
		general: '',
	});
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');

	const validateForm = (): boolean => {
		let isValid = true;
		const newErrors = { email: '', password: '', general: '' };

		if (!isValidEmail(email)) {
			newErrors.email = 'Please enter a valid email address.';
			isValid = false;
		}
		if (!isValidPassword(password)) {
			newErrors.password = 'Password must be at least 6 characters long.';
			isValid = false;
		}

		setErrors(newErrors);
		setSuccessMessage('');
		return isValid;
	};

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const validationPassed = validateForm();
		if (!validationPassed) return;

		setIsLoading(true);
		setErrors({ email: '', password: '', general: '' });

		try {
			const result = await login(email, password);
			if (!result.success && result.error) {
				setErrors((prev) => ({ ...prev, general: result.error || '' }));
			}
			// If successful, the server action will redirect
		} catch {
			// Redirect throws an error, which is expected behavior
		} finally {
			setIsLoading(false);
		}
	};

	const handleSignup = async (event: React.MouseEvent) => {
		event.preventDefault();
		const validationPassed = validateForm();
		if (!validationPassed) return;

		setIsLoading(true);
		setErrors({ email: '', password: '', general: '' });

		try {
			const result = await signup(email, password);

			if (!result.success && result.error) {
				setErrors((prev) => ({ ...prev, general: result.error || '' }));
				return;
			}

			if (result.success && result.userId) {
				// Save quiz results if they exist in localStorage
				const quizResults = localStorage.getItem('quizResults');
				if (quizResults) {
					try {
						const likedRecipes = JSON.parse(quizResults);
						if (Array.isArray(likedRecipes) && likedRecipes.length > 0) {
							await saveQuizResultsForUser(result.userId, likedRecipes);
						}
						localStorage.removeItem('quizResults');
					} catch {
						// Ignore parse errors
					}
				}

				setSuccessMessage(
					'Account created! Please check your email to confirm your account.'
				);
			}
		} catch {
			setErrors((prev) => ({
				...prev,
				general: 'An unexpected error occurred. Please try again.',
			}));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex items-center justify-center bg-cream px-4 -my-8 min-h-[calc(100vh-8rem)]">
			<div className="w-full max-w-md">
				<div className="bg-white rounded-2xl shadow-lg p-8">
					<div className="text-center mb-8">
						<h1 className="text-2xl font-semibold text-charcoal mb-2">
							Welcome Back
						</h1>
						<p className="text-charcoal-muted text-sm">
							Sign in to continue to your meal planner
						</p>
					</div>

					<form onSubmit={(event) => handleLogin(event)} className="space-y-5">
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-charcoal mb-1.5"
							>
								Email
							</label>
							<input
								id="email"
								name="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full px-4 py-3 rounded-lg border border-cream-dark bg-cream-light
									text-charcoal placeholder-charcoal-muted
									focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
									transition-all duration-200"
								placeholder="you@example.com"
							/>
							{errors.email && (
								<p className="mt-1.5 text-sm text-red-500">{errors.email}</p>
							)}
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-charcoal mb-1.5"
							>
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="w-full px-4 py-3 rounded-lg border border-cream-dark bg-cream-light
									text-charcoal placeholder-charcoal-muted
									focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
									transition-all duration-200"
								placeholder="Enter your password"
							/>
							{errors.password && (
								<p className="mt-1.5 text-sm text-red-500">{errors.password}</p>
							)}
						</div>

						{errors.general && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-3">
								<p className="text-sm text-red-600 text-center">
									{errors.general}
								</p>
							</div>
						)}

						{successMessage && (
							<div className="bg-green-50 border border-green-200 rounded-lg p-3">
								<p className="text-sm text-green-600 text-center">
									{successMessage}
								</p>
							</div>
						)}

						<div className="space-y-3 pt-2">
							<button
								type="submit"
								disabled={isLoading}
								className="w-full btn-primary-filled py-3 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? 'Signing in...' : 'Log in'}
							</button>

							<button
								type="button"
								onClick={(event) => handleSignup(event)}
								disabled={isLoading}
								className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? 'Creating account...' : 'Sign up'}
							</button>
						</div>
					</form>
				</div>

				<p className="text-center text-charcoal-muted text-sm mt-6">
					By continuing, you agree to our Terms of Service
				</p>
			</div>
		</div>
	);
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
	return password.length >= 6;
}
