'use client';

import {
	calculateIngredientStats,
	IngredientStats as Stats,
} from '@/utilities/ingredientStats';
import { useMemo, useState } from 'react';
import { Recipe } from '../../../database.types';

interface IngredientStatsProps {
	recipes: Recipe[];
	compact?: boolean;
}

export function IngredientStats({
	recipes,
	compact = false,
}: IngredientStatsProps) {
	const [showDetails, setShowDetails] = useState(false);

	const stats = useMemo(() => calculateIngredientStats(recipes), [recipes]);

	if (recipes.length === 0) {
		return null;
	}

	if (compact) {
		return (
			<div className="flex items-center gap-4 text-sm">
				<div className="flex items-center gap-1.5">
					<ShoppingBagIcon className="w-4 h-4 text-primary" />
					<span className="text-charcoal font-medium">
						{stats.totalUniqueIngredients}
					</span>
					<span className="text-charcoal-muted">ingredients to buy</span>
				</div>
				{stats.overlappingIngredients.length > 0 && (
					<div className="flex items-center gap-1.5">
						<OverlapIcon className="w-4 h-4 text-green-600" />
						<span className="text-green-600 font-medium">
							{stats.overlappingIngredients.length}
						</span>
						<span className="text-charcoal-muted">shared</span>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="bg-white rounded-xl overflow-hidden">
			{/* Summary Header */}
			<div className="p-4 sm:p-5 border-b border-cream-dark">
				<div className="flex items-center justify-between mb-3">
					<h3 className="font-semibold text-charcoal flex items-center gap-2">
						<ShoppingBagIcon className="w-5 h-5 text-primary" />
						Ingredient Summary
					</h3>
					{stats.overlappingIngredients.length > 0 && (
						<span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium">
							{stats.estimatedSavings} less waste
						</span>
					)}
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 gap-3">
					<StatCard
						icon={<ListIcon className="w-5 h-5" />}
						value={stats.totalUniqueIngredients}
						label="Ingredients to buy"
						color="primary"
					/>
					<StatCard
						icon={<OverlapIcon className="w-5 h-5" />}
						value={stats.overlappingIngredients.length}
						label="Shared ingredients"
						color="green"
					/>
				</div>
			</div>

			{/* Shared Ingredients */}
			{stats.overlappingIngredients.length > 0 && (
				<div className="p-4 sm:p-5">
					<button
						onClick={() => setShowDetails(!showDetails)}
						className="w-full flex items-center justify-between text-sm font-medium text-charcoal hover:text-primary transition-colors"
					>
						<span>
							Shared ingredients save you trips to the store
						</span>
						<ChevronIcon
							className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
						/>
					</button>

					{showDetails && (
						<div className="mt-4 space-y-2">
							{stats.overlappingIngredients.slice(0, 10).map((ing) => (
								<div
									key={ing.name}
									className="flex items-center justify-between py-2 px-3 bg-cream-light rounded-lg"
								>
									<span className="text-sm text-charcoal">{ing.name}</span>
									<span className="text-xs text-charcoal-muted">
										Used in {ing.count} recipes
									</span>
								</div>
							))}
							{stats.overlappingIngredients.length > 10 && (
								<p className="text-xs text-charcoal-muted text-center pt-2">
									+{stats.overlappingIngredients.length - 10} more shared
									ingredients
								</p>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

interface StatCardProps {
	icon: React.ReactNode;
	value: number;
	label: string;
	color: 'primary' | 'green' | 'blue';
}

function StatCard({ icon, value, label, color }: StatCardProps) {
	const colorClasses = {
		primary: 'bg-primary/10 text-primary',
		green: 'bg-green-100 text-green-600',
		blue: 'bg-blue-100 text-blue-600',
	};

	return (
		<div className="bg-cream-light rounded-lg p-3 sm:p-4">
			<div className="flex items-center gap-3">
				<div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
				<div>
					<div className="text-xl sm:text-2xl font-bold text-charcoal">
						{value}
					</div>
					<div className="text-xs text-charcoal-muted">{label}</div>
				</div>
			</div>
		</div>
	);
}

function ShoppingBagIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
			<line x1="3" y1="6" x2="21" y2="6" />
			<path d="M16 10a4 4 0 0 1-8 0" />
		</svg>
	);
}

function ListIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<line x1="8" y1="6" x2="21" y2="6" />
			<line x1="8" y1="12" x2="21" y2="12" />
			<line x1="8" y1="18" x2="21" y2="18" />
			<line x1="3" y1="6" x2="3.01" y2="6" />
			<line x1="3" y1="12" x2="3.01" y2="12" />
			<line x1="3" y1="18" x2="3.01" y2="18" />
		</svg>
	);
}

function OverlapIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="9" cy="12" r="5" />
			<circle cx="15" cy="12" r="5" />
		</svg>
	);
}

function ChevronIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="6 9 12 15 18 9" />
		</svg>
	);
}
