'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
	isLoggedIn: boolean;
	userEmail?: string;
	userId?: string;
}

export function Header({ isLoggedIn, userEmail, userId }: HeaderProps) {
	const pathname = usePathname();

	const isActive = (path: string) => pathname === path;

	return (
		<header className="w-full bg-cream-light border-b border-cream-dark">
			<div className="max-w-7xl mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
					<Link
						href="/"
						className="text-2xl font-bold tracking-tight text-primary"
					>
						PLATE MATE
					</Link>

					<nav className="hidden md:flex items-center gap-8">
						<Link
							href="/recipes"
							className={`nav-link ${isActive('/recipes') ? 'text-primary-dark' : ''}`}
						>
							Recipes
						</Link>
						{isLoggedIn && (
							<>
								<Link
									href={`/${userId}`}
									className={`nav-link ${isActive(`/${userId}`) ? 'text-primary-dark' : ''}`}
								>
									Meal Plan
								</Link>
								<Link
									href="/grocery-list"
									className={`nav-link ${isActive('/grocery-list') ? 'text-primary-dark' : ''}`}
								>
									Grocery List
								</Link>
							</>
						)}
					</nav>

					<div className="flex items-center gap-4">
						{isLoggedIn ? (
							<div className="flex items-center gap-4">
								<span className="text-sm text-charcoal-muted hidden sm:inline">
									{userEmail}
								</span>
								<Link href={`/${userId}`} className="btn-primary">
									My Plan
								</Link>
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
				</div>
			</div>
		</header>
	);
}
