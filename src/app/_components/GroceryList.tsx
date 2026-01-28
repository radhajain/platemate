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
import {
	Apple,
	Milk,
	Beef,
	Croissant,
	Package,
	Sparkles,
	Snowflake,
	MoreHorizontal,
	Star,
	ChevronRight,
	Check,
	Copy,
	RotateCcw,
	ChevronsUpDown,
} from 'lucide-react';

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

	const allCategoryNames = React.useMemo(() => {
		const names = groceryList?.categories.map((c) => c.name) || [];
		if (weeklyStaples.length > 0) {
			names.unshift('Weekly Staples');
		}
		return names;
	}, [groceryList, weeklyStaples]);

	const allExpanded = allCategoryNames.every((name) =>
		expandedCategories.has(name)
	);

	const toggleAllCategories = () => {
		if (allExpanded) {
			setExpandedCategories(new Set());
		} else {
			setExpandedCategories(new Set(allCategoryNames));
		}
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
		<div className="bg-white rounded-xl overflow-hidden lg:rounded-t-none">
			{/* Header */}
			<div className="p-4 border-b border-cream-dark">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h2 className="text-lg font-semibold text-charcoal">Grocery List</h2>
						<p className="text-sm text-charcoal-muted">
							{checkedCount} of {totalItems} items checked
						</p>
					</div>
					<div className="flex items-center gap-1">
						<button
							onClick={toggleAllCategories}
							className="p-2 text-charcoal-muted hover:text-charcoal hover:bg-cream-light rounded-lg transition-colors"
							title={allExpanded ? 'Collapse all' : 'Expand all'}
						>
							<ChevronsUpDown className="w-5 h-5" />
						</button>
						<button
							onClick={clearChecked}
							className="p-2 text-charcoal-muted hover:text-charcoal hover:bg-cream-light rounded-lg transition-colors"
							title="Clear checked"
						>
							<RotateCcw className="w-5 h-5" />
						</button>
						<button
							onClick={copyToClipboard}
							className="p-2 text-charcoal-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
							title="Copy list"
						>
							<Copy className="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>

			{/* Progress bar */}
			{totalItems > 0 && (
				<div className="px-4 py-2 bg-cream-light">
					<div className="h-2 bg-cream-dark rounded-full overflow-hidden">
						<div
							className="h-full bg-primary transition-all duration-300"
							style={{ width: `${(checkedCount / totalItems) * 100}%` }}
						/>
					</div>
				</div>
			)}

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

		</div>
	);
}

// Get icon for category
function getCategoryIcon(categoryName: string) {
	const iconMap: Record<string, React.ReactNode> = {
		'Weekly Staples': <Star className="w-5 h-5 text-primary" />,
		Produce: <Apple className="w-5 h-5 text-green-600" />,
		'Dairy & Eggs': <Milk className="w-5 h-5 text-blue-500" />,
		'Meat & Seafood': <Beef className="w-5 h-5 text-red-500" />,
		Bakery: <Croissant className="w-5 h-5 text-amber-600" />,
		Pantry: <Package className="w-5 h-5 text-orange-500" />,
		'Spices & Seasonings': <Sparkles className="w-5 h-5 text-purple-500" />,
		Frozen: <Snowflake className="w-5 h-5 text-cyan-500" />,
		Other: <MoreHorizontal className="w-5 h-5 text-gray-500" />,
	};
	return iconMap[categoryName] || <Package className="w-5 h-5 text-gray-500" />;
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
						<ChevronRight className="w-4 h-4" />
					</span>
					{getCategoryIcon(category.name)}
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
									{isChecked && <Check className="w-3 h-3" />}
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
						<ChevronRight className="w-4 h-4" />
					</span>
					{getCategoryIcon('Weekly Staples')}
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
									{isChecked && <Check className="w-3 h-3" />}
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

