'use client';

import { FormEvent, useState } from 'react';
import { login, signup } from '../login/actions';

export default function LoginForm() {
	const [errors, setErrors] = useState({
		email: '',
		password: '',
		general: '',
	});
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

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
		return isValid;
	};

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const validationPassed = validateForm();
		if (!validationPassed) return;
		await login(email, password);
	};

	const handleSignup = async (event: React.MouseEvent) => {
		event.preventDefault();
		const validationPassed = validateForm();
		if (!validationPassed) return;
		await signup(email, password);
	};

	return (
		<form onSubmit={(event) => handleLogin(event)}>
			<h1>Login Page</h1>
			<label htmlFor="email">Email:</label>
			<input
				id="email"
				name="email"
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				required
			/>
			{errors.email && <p style={{ color: 'red' }}>{errors.email}</p>}

			<label htmlFor="password">Password:</label>
			<input
				id="password"
				name="password"
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				required
			/>
			{errors.password && <p style={{ color: 'red' }}>{errors.password}</p>}

			<button type="submit">Log in</button>

			<button type="button" onClick={(event) => handleSignup(event)}>
				Sign up
			</button>

			{errors.general && <p style={{ color: 'red' }}>{errors.general}</p>}
		</form>
	);
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
	return password.length >= 6;
}
