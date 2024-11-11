import { createClient } from '@supabase/supabase-js';
import { configDotenv } from 'dotenv';

export async function createSupabaseClient() {
	configDotenv({ path: '.env.development.local' });
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (url == null || key == null) {
		throw new Error('Missing Supabase URL or Anon Key');
	}
	return createClient(url, key);
}
