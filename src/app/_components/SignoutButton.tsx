'use client';
import { createClient } from '@/services/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export function SignoutButton() {
	const supabase = createClient();
	const router = useRouter();
	const { mutate: signOut, isPending } = useMutation({
		mutationFn: async () => {
			await supabase.auth.signOut({ scope: 'local' });
			router.refresh();
		},
	});

	return (
		<button onClick={() => signOut()}>
			{isPending ? 'Logging out...' : 'Logout'}
		</button>
	);
}
