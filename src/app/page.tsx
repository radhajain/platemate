import Link from 'next/link';

export default async function Home() {
	return (
		<div className="flex flex-col gap-16">
			{/* Hero Section */}
			<section className="text-center py-16">
				<h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
					Plan Smarter, Waste Less
				</h1>
				<p className="text-lg md:text-xl text-charcoal-muted max-w-2xl mx-auto mb-8">
					Plate Mate creates weekly meal plans with recipes that share
					ingredients, so you buy less and waste nothing.
				</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
					<Link href="/quiz" className="btn-primary-filled">
						Get Started
					</Link>
					<Link href="/recipes" className="btn-primary">
						Browse Recipes
					</Link>
				</div>
			</section>

			{/* Features Section */}
			<section className="grid md:grid-cols-3 gap-8">
				<div className="text-center p-6">
					<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-primary"
						>
							<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
							<line x1="6" y1="17" x2="18" y2="17" />
						</svg>
					</div>
					<h3 className="text-lg font-semibold text-charcoal mb-2">
						Smart Recipe Selection
					</h3>
					<p className="text-charcoal-muted">
						AI picks recipes that share ingredients, maximizing what you buy.
					</p>
				</div>

				<div className="text-center p-6">
					<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-primary"
						>
							<path d="M3 6h18" />
							<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
							<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
							<line x1="10" y1="11" x2="10" y2="17" />
							<line x1="14" y1="11" x2="14" y2="17" />
						</svg>
					</div>
					<h3 className="text-lg font-semibold text-charcoal mb-2">
						Reduce Food Waste
					</h3>
					<p className="text-charcoal-muted">
						No more half-used vegetables rotting in the fridge.
					</p>
				</div>

				<div className="text-center p-6">
					<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-primary"
						>
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
							<line x1="16" y1="2" x2="16" y2="6" />
							<line x1="8" y1="2" x2="8" y2="6" />
							<line x1="3" y1="10" x2="21" y2="10" />
						</svg>
					</div>
					<h3 className="text-lg font-semibold text-charcoal mb-2">
						Weekly Meal Plans
					</h3>
					<p className="text-charcoal-muted">
						Generate a complete week of meals with one click.
					</p>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="bg-white rounded-xl p-8 md:p-12">
				<h2 className="text-2xl font-bold text-charcoal text-center mb-8">
					How It Works
				</h2>
				<div className="grid md:grid-cols-4 gap-6">
					<div className="text-center">
						<div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
							1
						</div>
						<h4 className="font-medium text-charcoal mb-1">Pick Favorites</h4>
						<p className="text-sm text-charcoal-muted">
							Browse and select recipes you love
						</p>
					</div>
					<div className="text-center">
						<div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
							2
						</div>
						<h4 className="font-medium text-charcoal mb-1">Generate Plan</h4>
						<p className="text-sm text-charcoal-muted">
							AI creates an optimized weekly menu
						</p>
					</div>
					<div className="text-center">
						<div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
							3
						</div>
						<h4 className="font-medium text-charcoal mb-1">Get Your List</h4>
						<p className="text-sm text-charcoal-muted">
							Organized grocery list by category
						</p>
					</div>
					<div className="text-center">
						<div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
							4
						</div>
						<h4 className="font-medium text-charcoal mb-1">Cook & Enjoy</h4>
						<p className="text-sm text-charcoal-muted">
							Make delicious meals all week
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
