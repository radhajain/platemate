import Image from 'next/image';
import * as React from 'react';
import { Recipe } from '../../../database.types';
import { CheckIcon, IconButton, PlusIcon } from './Button';

interface RecipeCardProps {
	recipe: Recipe;
	isSelected?: boolean;
	onToggle?: () => void;
	showSelectButton?: boolean;
}

export function RecipeCard({
	recipe,
	isSelected = false,
	onToggle,
	showSelectButton = true,
}: RecipeCardProps) {
	return (
		<div className="card group relative">
			<div className="aspect-square relative overflow-hidden bg-cream">
				{recipe.image ? (
					<Image
						src={recipe.image}
						alt={recipe.name ?? 'Recipe'}
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-300"
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-charcoal-muted">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="48"
							height="48"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
							<line x1="6" y1="17" x2="18" y2="17" />
						</svg>
					</div>
				)}
				{showSelectButton && onToggle && (
					<div className="absolute bottom-3 right-3">
						<IconButton
							icon={isSelected ? <CheckIcon /> : <PlusIcon />}
							label={isSelected ? 'Remove from selection' : 'Add to selection'}
							onClick={onToggle}
							className={
								isSelected
									? 'bg-primary text-white border-primary'
									: 'bg-white'
							}
						/>
					</div>
				)}
			</div>
			<div className="p-4">
				<h3 className="font-medium text-charcoal line-clamp-2">
					{recipe.name}
				</h3>
				{(recipe.prepTime || recipe.cookTime) && (
					<p className="text-sm text-charcoal-muted mt-1">
						{recipe.prepTime && `Prep: ${recipe.prepTime}`}
						{recipe.prepTime && recipe.cookTime && ' | '}
						{recipe.cookTime && `Cook: ${recipe.cookTime}`}
					</p>
				)}
				{recipe.servings && (
					<p className="text-sm text-charcoal-muted">
						Serves: {recipe.servings}
					</p>
				)}
			</div>
		</div>
	);
}

interface IngredientCardProps {
	name: string;
	isChecked?: boolean;
	onToggle?: () => void;
	category?: string;
	isPerishable?: boolean;
}

export function IngredientCard({
	name,
	isChecked = false,
	onToggle,
	isPerishable = false,
}: IngredientCardProps) {
	return (
		<div
			className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
				isChecked
					? 'bg-cream-dark border-cream-dark'
					: 'bg-white border-cream-dark hover:border-primary'
			}`}
		>
			<button
				onClick={onToggle}
				className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
					isChecked
						? 'bg-primary border-primary text-white'
						: 'border-charcoal-muted'
				}`}
			>
				{isChecked && <CheckIcon />}
			</button>
			<span
				className={`flex-1 ${isChecked ? 'line-through text-charcoal-muted' : 'text-charcoal'}`}
			>
				{name}
			</span>
			{isPerishable && (
				<span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
					Use soon
				</span>
			)}
		</div>
	);
}
