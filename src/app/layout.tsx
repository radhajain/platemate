import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QueryProvider from './[components]/QueryClientProvider';

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

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<QueryProvider>{children}</QueryProvider>
			</body>
		</html>
	);
}
