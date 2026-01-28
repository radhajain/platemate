import { getUserProfile } from '@/services/supabase/api';
import { getUser } from '@/utilities/getUser';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { AuthHashHandler } from './_components/AuthHashHandler';
import { Header } from './_components/Header';
import QueryProvider from './_components/QueryClientProvider';
import './globals.css';

const geistSans = localFont({
	src: './fonts/GeistVF.woff',
	variable: '--font-geist-sans',
	weight: '100 900',
});
const geistMono = localFont({
	src: './fonts/GeistMonoVF.woff',
	variable: '--font-geist-mono',
	weight: '100 900',
});

export const metadata: Metadata = {
	title: 'Plate Mate - Smart Meal Planning',
	description:
		'Plan your weekly meals with smart recipe suggestions that reduce food waste',
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { isLoggedIn, user } = await getUser();

	// Get user's first name if logged in
	let firstName: string | undefined;
	if (user?.id) {
		const profile = await getUserProfile(user.id);
		firstName = profile?.first_name ?? undefined;
	}

	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-cream`}
			>
				<QueryProvider>
					<AuthHashHandler />
					<div className="min-h-screen flex flex-col">
						<Header
							isLoggedIn={isLoggedIn}
							userEmail={user?.email}
							userId={user?.id}
							firstName={firstName}
						/>
						<main className="flex-1">
							<div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
						</main>
						<footer className="bg-cream-light border-t border-cream-dark py-4 sm:py-6">
							<div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-charcoal-muted">
								Plate Mate - Reduce food waste with smart meal planning
							</div>
						</footer>
					</div>
				</QueryProvider>
			</body>
		</html>
	);
}
