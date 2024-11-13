import { getUser } from '@/utilities/getUser';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import QueryProvider from './_components/QueryClientProvider';
import './globals.css';
import { SignoutButton } from './_components/SignoutButton';

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
	title: 'Plate mate',
	description: 'Create weekly menus based on your preferences',
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { isLoggedIn, user } = await getUser();
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<QueryProvider>
					<main className="flex justify-center h-screen">
						<div>
							{isLoggedIn && (
								<div className="flex flex-col gap-5">
									<div>{user.email}</div>
									<SignoutButton />
								</div>
							)}
						</div>
						<div className="w-full md:max-w-6xl flex bg-white">{children}</div>
					</main>
				</QueryProvider>
			</body>
		</html>
	);
}
