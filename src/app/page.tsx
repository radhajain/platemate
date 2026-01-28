import { getUser } from '@/utilities/getUser';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const SAMPLE_RECIPES = [
	{
		image:
			'https://static01.nyt.com/images/2026/01/16/multimedia/19FD-DIET-RESET-3REX-PW-Chicken-and-Herb-Salad-With-Date-Lime-Dressing-hfcp/19FD-DIET-RESET-3REX-PW-Chicken-and-Herb-Salad-With-Date-Lime-Dressing-hfcp-threeByTwoMediumAt2X.jpg?quality=75&auto=webp',
		name: 'Chicken and Herb Salad',
	},
	{
		image:
			'https://cdn.loveandlemons.com/wp-content/uploads/2025/12/white-bean-soup-1-1160x1502.jpg',
		name: 'White Bean Soup',
	},
	{
		image:
			'https://static01.nyt.com/images/2020/10/28/dining/garlic-kale-salad/merlin_105432130_4e30fd58-8264-4bdf-95f9-d05db12d0570-threeByTwoMediumAt2X.jpg?quality=75&auto=webp',
		name: 'Lemon-Garlic Kale Salad',
	},
];

function GroceryListGraphic() {
	return (
		<div className="bg-white rounded-lg shadow-md p-4 w-36 text-left">
			<p className="text-xs font-semibold text-charcoal mb-2 uppercase tracking-wider-custom">
				Grocery List
			</p>
			<ul className="space-y-1.5 text-xs text-charcoal-muted">
				<li className="flex items-center gap-2">
					<span className="w-3 h-3 border border-primary rounded-sm flex-shrink-0" />
					Spinach
				</li>
				<li className="flex items-center gap-2">
					<span className="w-3 h-3 border border-primary rounded-sm flex-shrink-0 bg-primary" />
					<span className="line-through">Chickpeas</span>
				</li>
				<li className="flex items-center gap-2">
					<span className="w-3 h-3 border border-primary rounded-sm flex-shrink-0" />
					Lemon
				</li>
				<li className="flex items-center gap-2">
					<span className="w-3 h-3 border border-primary rounded-sm flex-shrink-0" />
					Garlic
				</li>
			</ul>
		</div>
	);
}

export default async function Home() {
	const { isLoggedIn, user } = await getUser();

	if (isLoggedIn && user) {
		redirect(`/${user.id}`);
	}

	return (
		<div className="flex flex-col justify-between gap-6 -my-8 min-h-[calc(100vh-8rem)] py-6">
			{/* Hero + Recipe Images */}
			<section className="flex flex-col lg:flex-row items-center gap-8 lg:gap-20">
				<div className="flex-1 text-center lg:text-left max-w-xl">
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mb-3 leading-tight">
						Meal planning for
						<br />
						<span className="text-primary">
							busy people that want fresh and healthy food
						</span>
					</h1>
					<p className="text-charcoal-muted mb-5 text-sm md:text-base px-4 lg:px-0">
						But want to minimize waste, save time grocery shopping and avoid
						decision fatigue of choosing recipes.
					</p>
					<div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
						<Link href="/quiz" className="btn-primary-filled">
							Start Planning
						</Link>
						<Link href="/recipes" className="btn-primary">
							Browse Recipes
						</Link>
					</div>
				</div>

				{/* Floating Recipe Images + Grocery List */}
				<div className="relative w-full max-w-xs sm:max-w-sm h-56 sm:h-64 lg:h-72 mx-auto lg:mx-0">
					{/* Main large image */}
					<div className="absolute top-0 right-0 sm:right-0 w-32 sm:w-40 h-32 sm:h-40 rounded-xl overflow-hidden shadow-lg z-10 animate-float-slow">
						<Image
							src={SAMPLE_RECIPES[0].image}
							alt={SAMPLE_RECIPES[0].name}
							fill
							className="object-cover"
							sizes="(max-width: 640px) 128px, 160px"
						/>
					</div>
					{/* Second image - offset left */}
					<div className="absolute top-8 sm:top-12 left-0 sm:left-4 w-24 sm:w-32 h-24 sm:h-32 rounded-xl overflow-hidden shadow-lg z-20 animate-float-medium">
						<Image
							src={SAMPLE_RECIPES[1].image}
							alt={SAMPLE_RECIPES[1].name}
							fill
							className="object-cover"
							sizes="(max-width: 640px) 96px, 128px"
						/>
					</div>
					{/* Third image - bottom right */}
					<div className="absolute bottom-0 right-4 sm:right-8 w-24 sm:w-28 h-24 sm:h-28 rounded-xl overflow-hidden shadow-lg z-10 animate-float-fast">
						<Image
							src={SAMPLE_RECIPES[2].image}
							alt={SAMPLE_RECIPES[2].name}
							fill
							className="object-cover"
							sizes="(max-width: 640px) 96px, 112px"
						/>
					</div>
					{/* Grocery list graphic - bottom left */}
					<div className="absolute bottom-2 sm:bottom-4 left-0 z-30 animate-float-grocery scale-90 sm:scale-100 origin-bottom-left">
						<GroceryListGraphic />
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="bg-white rounded-xl p-6">
				<h2 className="text-lg font-semibold text-charcoal text-center mb-5">
					How It Works
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="text-center">
						<div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
							1
						</div>
						<h4 className="font-medium text-charcoal text-sm mb-0.5">
							Pick Favorites
						</h4>
						<p className="text-xs text-charcoal-muted">
							Browse and select recipes
						</p>
					</div>
					<div className="text-center">
						<div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
							2
						</div>
						<h4 className="font-medium text-charcoal text-sm mb-0.5">
							Generate Plan
						</h4>
						<p className="text-xs text-charcoal-muted">
							AI creates your weekly menu
						</p>
					</div>
					<div className="text-center">
						<div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
							3
						</div>
						<h4 className="font-medium text-charcoal text-sm mb-0.5">
							Get Your List
						</h4>
						<p className="text-xs text-charcoal-muted">
							Organized grocery list
						</p>
					</div>
					<div className="text-center">
						<div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
							4
						</div>
						<h4 className="font-medium text-charcoal text-sm mb-0.5">
							Cook & Enjoy
						</h4>
						<p className="text-xs text-charcoal-muted">
							Delicious meals all week
						</p>
					</div>
				</div>
			</section>

			{/* Recipes From Section */}
			<section className="text-center">
				<p className="text-xs uppercase tracking-wider-custom text-charcoal-muted mb-4">
					Recipes from
				</p>
				<div className="flex items-center justify-center gap-10 flex-wrap">
					<span className="text-charcoal font-serif text-lg opacity-60 hover:opacity-100 transition-opacity">
						Love & Lemons
					</span>
					<span className="text-charcoal font-serif text-lg opacity-60 hover:opacity-100 transition-opacity">
						NYT Cooking
					</span>
				</div>
			</section>
		</div>
	);
}
