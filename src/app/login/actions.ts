'use server';

import { saveUserLikedRecipes } from '@/services/supabase/api';
import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function login(email: string, password: string) {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.signInWithPassword({ email, password });

	if (error) {
		redirect('/error');
	}

	// revalidatePath('/', 'layout');
	redirect(user == null ? '/' : `/${user.id}`);
}

export async function signup(email: string, password: string) {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.signUp({ email, password });

	if (error) {
		redirect('/error');
	}
	const quizResults = localStorage.getItem('quizResults');
	if (quizResults != null && user != null) {
		const likedRecipes = JSON.parse(quizResults);
		await saveUserLikedRecipes(user, likedRecipes);
		localStorage.removeItem('quizResults');
	}

	revalidatePath('/', 'layout');
	redirect(user == null ? '/' : `/${user.id}`);
}
