'use client';

import { generateGroceryList } from '@/services/supabase/api';
import {
	GroceryCategory,
	StructuredGroceryList,
} from '@/utilities/prompts/dedupeGroceryList';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { Recipe } from '../../../database.types';
import { Button } from './Button';

interface GroceryListProps {
	recipes: readonly Recipe[];
	weeklyStaples?: string[];
}

export function GroceryList({ recipes, weeklyStaples = [] }: GroceryListProps) {
	const [checkedItems, setCheckedItems] = React.useState<Set<string>>(
		new Set()
	);
	const [expandedCategories, setExpandedCategories] = React.useState<
		Set<string>
	>(new Set());

	// Load checked items from localStorage on mount
	React.useEffect(() => {
		const stored = localStorage.getItem('groceryCheckedItems');
		if (stored) {
			try {
				setCheckedItems(new Set(JSON.parse(stored)));
			} catch {
				// Ignore parse errors
			}
		}
		// Expand all categories by default
		setExpandedCategories(
			new Set([
				'Weekly Staples',
				'Produce',
				'Dairy & Eggs',
				'Meat & Seafood',
				'Bakery',
				'Pantry',
				'Spices & Seasonings',
				'Frozen',
				'Other',
			])
		);
	}, []);

	// Save checked items to localStorage
	React.useEffect(() => {
		localStorage.setItem(
			'groceryCheckedItems',
			JSON.stringify(Array.from(checkedItems))
		);
	}, [checkedItems]);

	const {
		data: groceryList,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ['structuredGroceryList', recipes.map((r) => r.url).join(',')],
		queryFn: async () => {
			// Use server action for structured output
			return await generateGroceryList([...recipes]);
		},
		enabled: recipes.length > 0,
		staleTime: 1000 * 60 * 5, // Cache for 5 minutes
	});

	const toggleItem = (itemKey: string) => {
		setCheckedItems((prev) => {
			const next = new Set(prev);
			if (next.has(itemKey)) {
				next.delete(itemKey);
			} else {
				next.add(itemKey);
			}
			return next;
		});
	};

	const toggleCategory = (categoryName: string) => {
		setExpandedCategories((prev) => {
			const next = new Set(prev);
			if (next.has(categoryName)) {
				next.delete(categoryName);
			} else {
				next.add(categoryName);
			}
			return next;
		});
	};

	const clearChecked = () => {
		setCheckedItems(new Set());
		localStorage.removeItem('groceryCheckedItems');
	};

	const copyToClipboard = async () => {
		if (!groceryList) return;

		let text = '';

		// Add weekly staples first if any
		if (weeklyStaples.length > 0) {
			const staplesItems = weeklyStaples
				.map((item) => `  [ ] ${item}`)
				.join('\n');
			text += `Weekly Staples:\n${staplesItems}\n\n`;
		}

		text += groceryList.categories
			.map((cat) => {
				const items = cat.items
					.map((item) => `  [ ] ${item.quantity} ${item.name}`)
					.join('\n');
				return `${cat.name}:\n${items}`;
			})
			.join('\n\n');

		try {
			await navigator.clipboard.writeText(text);
			alert('Grocery list copied to clipboard!');
		} catch {
			console.error('Failed to copy to clipboard');
		}
	};

	const totalItems = (groceryList?.categories.reduce(
		(sum, cat) => sum + cat.items.length,
		0
	) || 0) + weeklyStaples.length;
	const checkedCount = checkedItems.size;

	if (recipes.length === 0) {
		return (
			<div className="bg-white rounded-xl p-8 text-center">
				<p className="text-charcoal-muted">
					No recipes selected. Generate a meal plan to see your grocery list.
				</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="bg-white rounded-xl p-8">
				<div className="flex items-center justify-center gap-3">
					<svg
						className="animate-spin h-5 w-5 text-primary"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					<span className="text-charcoal-muted">
						Creating your smart grocery list...
					</span>
				</div>
			</div>
		);
	}

	if (isError || !groceryList) {
		return (
			<div className="bg-white rounded-xl p-8 text-center">
				<p className="text-red-500 mb-4">
					Failed to generate grocery list. Please try again.
				</p>
				<Button variant="primary" onClick={() => refetch()}>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-xl overflow-hidden">
			{/* Header */}
			<div className="p-4 border-b border-cream-dark">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h2 className="text-lg sm:text-xl font-semibold text-charcoal">Grocery List</h2>
						<p className="text-sm text-charcoal-muted">
							{checkedCount} of {totalItems} items checked
						</p>
					</div>
					<div className="flex gap-2">
						<Button variant="ghost" onClick={clearChecked}>
							<span className="hidden sm:inline">Clear Checked</span>
							<span className="sm:hidden">Clear</span>
						</Button>
						<Button variant="primary" onClick={copyToClipboard}>
							<span className="hidden sm:inline">Copy List</span>
							<span className="sm:hidden">Copy</span>
						</Button>
					</div>
				</div>
			</div>

			{/* Categories */}
			<div className="divide-y divide-cream-dark">
				{/* Weekly Staples Section */}
				{weeklyStaples.length > 0 && (
					<StaplesSection
						staples={weeklyStaples}
						isExpanded={expandedCategories.has('Weekly Staples')}
						onToggle={() => toggleCategory('Weekly Staples')}
						checkedItems={checkedItems}
						onToggleItem={toggleItem}
					/>
				)}
				{groceryList.categories.map((category) => (
					<CategorySection
						key={category.name}
						category={category}
						isExpanded={expandedCategories.has(category.name)}
						onToggle={() => toggleCategory(category.name)}
						checkedItems={checkedItems}
						onToggleItem={toggleItem}
					/>
				))}
			</div>

			{/* Tips */}
			{groceryList.tips && groceryList.tips.length > 0 && (
				<div className="p-4 bg-yellow-50 border-t border-yellow-100">
					<h3 className="text-sm font-medium text-yellow-800 mb-2">
						Storage Tips
					</h3>
					<ul className="text-sm text-yellow-700 space-y-1">
						{groceryList.tips.map((tip, i) => (
							<li key={i}>• {tip}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

interface CategorySectionProps {
	category: GroceryCategory;
	isExpanded: boolean;
	onToggle: () => void;
	checkedItems: Set<string>;
	onToggleItem: (key: string) => void;
}

function CategorySection({
	category,
	isExpanded,
	onToggle,
	checkedItems,
	onToggleItem,
}: CategorySectionProps) {
	const checkedCount = category.items.filter((item) =>
		checkedItems.has(`${category.name}-${item.name}`)
	).length;

	return (
		<div>
			<button
				onClick={onToggle}
				className="w-full px-4 py-3 flex items-center justify-between hover:bg-cream-light transition-colors"
			>
				<div className="flex items-center gap-3">
					<span
						className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
					>
						<ChevronRight />
					</span>
					<span className="font-medium text-charcoal">{category.name}</span>
					<span className="text-sm text-charcoal-muted">
						({checkedCount}/{category.items.length})
					</span>
				</div>
			</button>

			{isExpanded && (
				<div className="px-4 pb-3 space-y-2">
					{category.items.map((item) => {
						const itemKey = `${category.name}-${item.name}`;
						const isChecked = checkedItems.has(itemKey);

						return (
							<div
								key={itemKey}
								className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
									isChecked
										? 'bg-cream-dark border-cream-dark'
										: 'bg-white border-cream-dark hover:border-primary'
								}`}
								onClick={() => onToggleItem(itemKey)}
							>
								<div
									className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
										isChecked
											? 'bg-primary border-primary text-white'
											: 'border-charcoal-muted'
									}`}
								>
									{isChecked && <CheckIcon />}
								</div>
								<div className="flex-1">
									<span
										className={`${isChecked ? 'line-through text-charcoal-muted' : 'text-charcoal'}`}
									>
										{item.quantity} {item.name}
									</span>
								</div>
								{item.isPerishable && (
									<span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
										Use soon
									</span>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

interface StaplesSectionProps {
	staples: string[];
	isExpanded: boolean;
	onToggle: () => void;
	checkedItems: Set<string>;
	onToggleItem: (key: string) => void;
}

function StaplesSection({
	staples,
	isExpanded,
	onToggle,
	checkedItems,
	onToggleItem,
}: StaplesSectionProps) {
	const checkedCount = staples.filter((item) =>
		checkedItems.has(`Weekly Staples-${item}`)
	).length;

	return (
		<div>
			<button
				onClick={onToggle}
				className="w-full px-4 py-3 flex items-center justify-between hover:bg-cream-light transition-colors bg-primary/5"
			>
				<div className="flex items-center gap-3">
					<span
						className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
					>
						<ChevronRight />
					</span>
					<span className="font-medium text-charcoal">Weekly Staples</span>
					<span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
						Every week
					</span>
					<span className="text-sm text-charcoal-muted">
						({checkedCount}/{staples.length})
					</span>
				</div>
			</button>

			{isExpanded && (
				<div className="px-4 pb-3 space-y-2 bg-primary/5">
					{staples.map((item) => {
						const itemKey = `Weekly Staples-${item}`;
						const isChecked = checkedItems.has(itemKey);

						return (
							<div
								key={itemKey}
								className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
									isChecked
										? 'bg-cream-dark border-cream-dark'
										: 'bg-white border-cream-dark hover:border-primary'
								}`}
								onClick={() => onToggleItem(itemKey)}
							>
								<div
									className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
										isChecked
											? 'bg-primary border-primary text-white'
											: 'border-charcoal-muted'
									}`}
								>
									{isChecked && <CheckIcon />}
								</div>
								<div className="flex-1">
									<span
										className={`${isChecked ? 'line-through text-charcoal-muted' : 'text-charcoal'}`}
									>
										{item}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

function ChevronRight() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="9 18 15 12 9 6" />
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="12"
			height="12"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="3"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="20 6 9 17 4 12" />
		</svg>
	);
}
