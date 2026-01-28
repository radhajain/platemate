'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/services/supabase/client';

interface HeaderProps {
	isLoggedIn: boolean;
	userEmail?: string;
	userId?: string;
	firstName?: string;
}

function ChevronDownIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={2}
			stroke="currentColor"
			className="w-4 h-4"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M19.5 8.25l-7.5 7.5-7.5-7.5"
			/>
		</svg>
	);
}

function UserIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={1.5}
			stroke="currentColor"
			className="w-5 h-5"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
			/>
		</svg>
	);
}

function MenuIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={1.5}
			stroke="currentColor"
			className="w-6 h-6"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
			/>
		</svg>
	);
}

function CloseIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={1.5}
			stroke="currentColor"
			className="w-6 h-6"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	);
}

export function Header({
	isLoggedIn,
	userEmail,
	userId,
	firstName,
}: HeaderProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const mobileMenuRef = useRef<HTMLDivElement>(null);

	const isActive = (path: string) => pathname === path;

	const displayName = firstName || userEmail?.split('@')[0] || 'Account';

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setDropdownOpen(false);
			}
			if (
				mobileMenuRef.current &&
				!mobileMenuRef.current.contains(event.target as Node)
			) {
				setMobileMenuOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Close mobile menu on route change
	useEffect(() => {
		setMobileMenuOpen(false);
	}, [pathname]);

	const handleSignOut = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push('/login');
	};

	return (
		<header className="w-full bg-cream-light border-b border-cream-dark">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
				<div className="flex items-center justify-between">
					<Link
						href="/"
						className="text-xl sm:text-2xl font-bold tracking-tight text-primary"
					>
						PLATE MATE
					</Link>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center gap-8">
						<Link
							href="/recipes"
							className={`nav-link ${isActive('/recipes') ? 'text-primary-dark' : ''}`}
						>
							Recipes
						</Link>
						{isLoggedIn && (
							<Link
								href={`/${userId}`}
								className={`nav-link ${isActive(`/${userId}`) ? 'text-primary-dark' : ''}`}
							>
								Meal Plan
							</Link>
						)}
					</nav>

					{/* Desktop Auth Section */}
					<div className="hidden md:flex items-center gap-4">
						{isLoggedIn ? (
							<div className="relative" ref={dropdownRef}>
								<button
									onClick={() => setDropdownOpen(!dropdownOpen)}
									className="flex items-center gap-2 px-4 py-2 rounded-full border border-cream-dark hover:border-primary transition-colors bg-white"
								>
									<UserIcon />
									<span className="text-sm font-medium text-charcoal">
										{displayName}
									</span>
									<ChevronDownIcon />
								</button>

								{dropdownOpen && (
									<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-cream-dark py-1 z-50">
										<Link
											href="/profile"
											className="block px-4 py-2 text-sm text-charcoal hover:bg-cream transition-colors"
											onClick={() => setDropdownOpen(false)}
										>
											Profile Settings
										</Link>
										<hr className="my-1 border-cream-dark" />
										<button
											onClick={handleSignOut}
											className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
										>
											Sign Out
										</button>
									</div>
								)}
							</div>
						) : (
							<div className="flex items-center gap-3">
								<Link href="/login" className="nav-link">
									Login
								</Link>
								<Link href="/quiz" className="btn-primary">
									Get Started
								</Link>
							</div>
						)}
					</div>

					{/* Mobile Menu Button */}
					<div className="md:hidden" ref={mobileMenuRef}>
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="p-2 text-charcoal hover:text-primary transition-colors"
							aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
						>
							{mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
						</button>

						{/* Mobile Menu Dropdown */}
						{mobileMenuOpen && (
							<div className="absolute top-full left-0 right-0 bg-white border-b border-cream-dark shadow-lg z-50">
								<div className="px-4 py-4 space-y-3">
									<Link
										href="/recipes"
										className={`block py-2 text-base font-medium ${
											isActive('/recipes')
												? 'text-primary-dark'
												: 'text-charcoal hover:text-primary'
										}`}
									>
										Recipes
									</Link>
									{isLoggedIn && (
										<Link
											href={`/${userId}`}
											className={`block py-2 text-base font-medium ${
												isActive(`/${userId}`)
													? 'text-primary-dark'
													: 'text-charcoal hover:text-primary'
											}`}
										>
											Meal Plan
										</Link>
									)}
									<hr className="border-cream-dark" />
									{isLoggedIn ? (
										<>
											<Link
												href="/profile"
												className="block py-2 text-base font-medium text-charcoal hover:text-primary"
											>
												Profile Settings
											</Link>
											<button
												onClick={handleSignOut}
												className="block w-full text-left py-2 text-base font-medium text-red-600 hover:text-red-700"
											>
												Sign Out
											</button>
										</>
									) : (
										<div className="flex flex-col gap-3 pt-2">
											<Link
												href="/login"
												className="block py-2 text-base font-medium text-charcoal hover:text-primary"
											>
												Login
											</Link>
											<Link href="/quiz" className="btn-primary-filled text-center">
												Get Started
											</Link>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
