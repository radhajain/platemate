'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Recipe } from '../../../database.types';
import { RecipeCard, RecipeDetailPanel } from './Card';

interface RecipeGridProps {
	recipes: Recipe[];
	likedUrls: Set<string>;
	onLikeToggle: (recipeUrl: string) => void;
	selectedUrls?: Set<string>;
	onSelect?: (recipeUrl: string) => void;
	showSelectButton?: boolean;
	showLikeButton?: boolean;
	showRemoveButton?: boolean;
	onRemove?: (recipeUrl: string) => void;
	columns?: 2 | 3 | 4;
}

export function RecipeGrid({
	recipes,
	likedUrls,
	onLikeToggle,
	selectedUrls = new Set(),
	onSelect,
	showSelectButton = true,
	showLikeButton = true,
	showRemoveButton = false,
	onRemove,
	columns = 4,
}: RecipeGridProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [expandedUrl, setExpandedUrl] = useState<string | null>(null);
	const gridRef = useRef<HTMLDivElement>(null);

	// Get expanded recipe from URL on mount
	useEffect(() => {
		const recipeParam = searchParams.get('recipe');
		if (recipeParam) {
			setExpandedUrl(decodeURIComponent(recipeParam));
		}
	}, [searchParams]);

	// Update URL when expanding/collapsing
	const handleExpand = useCallback(
		(recipeUrl: string | null) => {
			setExpandedUrl(recipeUrl);
			const params = new URLSearchParams(searchParams.toString());
			if (recipeUrl) {
				params.set('recipe', encodeURIComponent(recipeUrl));
			} else {
				params.delete('recipe');
			}
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams]
	);

	// Calculate which row the expanded recipe is in
	const getRowIndex = useCallback(
		(recipeUrl: string) => {
			const index = recipes.findIndex((r) => r.url === recipeUrl);
			if (index === -1) return -1;
			return Math.floor(index / columns);
		},
		[recipes, columns]
	);

	// Group recipes by rows
	const rows = useMemo(() => {
		const result: Recipe[][] = [];
		for (let i = 0; i < recipes.length; i += columns) {
			result.push(recipes.slice(i, i + columns));
		}
		return result;
	}, [recipes, columns]);

	const expandedRecipe = recipes.find((r) => r.url === expandedUrl);
	const expandedRowIndex = expandedUrl ? getRowIndex(expandedUrl) : -1;

	const gridColsClass = {
		2: 'grid-cols-1 sm:grid-cols-2',
		3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
		4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
	}[columns];

	return (
		<div ref={gridRef} className="space-y-6">
			{rows.map((row, rowIndex) => (
				<div key={rowIndex}>
					{/* Recipe row */}
					<div className={`grid gap-6 ${gridColsClass}`}>
						{row.map((recipe) => (
							<RecipeCard
								key={recipe.url}
								recipe={recipe}
								isLiked={likedUrls.has(recipe.url)}
								onLikeToggle={() => onLikeToggle(recipe.url)}
								isSelected={selectedUrls.has(recipe.url)}
								onSelect={onSelect ? () => onSelect(recipe.url) : undefined}
								showSelectButton={showSelectButton}
								showLikeButton={showLikeButton}
								showRemoveButton={showRemoveButton}
								onRemove={onRemove ? () => onRemove(recipe.url) : undefined}
								onClick={() =>
									handleExpand(expandedUrl === recipe.url ? null : recipe.url)
								}
								isExpanded={expandedUrl === recipe.url}
							/>
						))}
					</div>

					{/* Expanded detail panel - appears after this row */}
					{expandedRecipe && expandedRowIndex === rowIndex && (
						<div className="mt-6 animate-in slide-in-from-top-2 duration-200">
							<RecipeDetailPanel
								recipe={expandedRecipe}
								onClose={() => handleExpand(null)}
								isLiked={likedUrls.has(expandedRecipe.url)}
								onLikeToggle={() => onLikeToggle(expandedRecipe.url)}
							/>
						</div>
					)}
				</div>
			))}
		</div>
	);
}
