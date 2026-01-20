'use server';

import { saveUserLikedRecipes } from '@/services/supabase/api';
import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type AuthResult = {
	success: boolean;
	error?: string;
	userId?: string;
};

export async function login(email: string, password: string): Promise<AuthResult> {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.signInWithPassword({ email, password });

	if (error) {
		return {
			success: false,
			error: getAuthErrorMessage(error.message),
		};
	}

	if (!user) {
		return {
			success: false,
			error: 'Login failed. Please try again.',
		};
	}

	revalidatePath('/', 'layout');
	redirect(`/${user.id}`);
}

export async function signup(email: string, password: string): Promise<AuthResult> {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.signUp({ email, password });

	if (error) {
		return {
			success: false,
			error: getAuthErrorMessage(error.message),
		};
	}

	if (!user) {
		return {
			success: false,
			error: 'Signup failed. Please try again.',
		};
	}

	return {
		success: true,
		userId: user.id,
	};
}

export async function saveQuizResultsForUser(
	userId: string,
	likedRecipeUrls: string[]
): Promise<void> {
	const supabase = await createClient();
	const { data: user } = await supabase.auth.getUser();

	if (user?.user && likedRecipeUrls.length > 0) {
		await saveUserLikedRecipes(user.user, new Set(likedRecipeUrls));
	}
}

function getAuthErrorMessage(errorMessage: string): string {
	// Map Supabase error messages to user-friendly messages
	if (errorMessage.includes('Invalid login credentials')) {
		return 'Invalid email or password. Please try again.';
	}
	if (errorMessage.includes('Email not confirmed')) {
		return 'Please check your email and confirm your account.';
	}
	if (errorMessage.includes('User already registered')) {
		return 'An account with this email already exists. Try logging in instead.';
	}
	if (errorMessage.includes('Password should be')) {
		return 'Password must be at least 6 characters long.';
	}
	if (errorMessage.includes('rate limit')) {
		return 'Too many attempts. Please wait a moment and try again.';
	}
	// Return original message for unhandled errors
	return errorMessage;
}
