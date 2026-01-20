'use client';

import { getSource } from '@/utilities/getSource';
import Image from 'next/image';
import { Recipe } from '../../../database.types';
import { CheckIcon } from './Button';

// Heart icons for like functionality
export function HeartIcon({ filled = false }: { filled?: boolean }) {
	return filled ? (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className="w-5 h-5"
		>
			<path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
		</svg>
	) : (
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
				d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
			/>
		</svg>
	);
}

function PlusIconLarge() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={2}
			stroke="currentColor"
			className="w-6 h-6"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M12 4.5v15m7.5-7.5h-15"
			/>
		</svg>
	);
}

// Check icon for selected state
function CheckIconLarge() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={2.5}
			stroke="currentColor"
			className="w-6 h-6"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M4.5 12.75l6 6 9-13.5"
			/>
		</svg>
	);
}

// X icon for remove
export function XIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={2}
			stroke="currentColor"
			className="w-5 h-5"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	);
}

interface RecipeCardProps {
	recipe: Recipe;
	isSelected?: boolean;
	onSelect?: () => void;
	isLiked?: boolean;
	onLikeToggle?: () => void;
	showLikeButton?: boolean;
	showSelectButton?: boolean;
	onClick?: () => void;
	isExpanded?: boolean;
	onRemove?: () => void;
	showRemoveButton?: boolean;
}

export function RecipeCard({
	recipe,
	isSelected = false,
	onSelect,
	isLiked = false,
	onLikeToggle,
	showLikeButton = false,
	showSelectButton = true,
	onClick,
	isExpanded = false,
	onRemove,
	showRemoveButton = false,
}: RecipeCardProps) {
	return (
		<div
			className={`overflow-hidden cursor-pointer transition-all duration-200 ${
				isExpanded ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
			}`}
			onClick={onClick}
		>
			{/* Image Container */}
			<div className="aspect-square relative overflow-hidden bg-cream">
				{recipe.image ? (
					<Image
						src={recipe.image}
						alt={recipe.name ?? 'Recipe'}
						fill
						className="object-cover"
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
						quality={85}
						unoptimized={recipe.image.includes('loveandlemons.com')}
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-charcoal-muted">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="64"
							height="64"
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

				{/* Like button (heart) in top left */}
				{showLikeButton && onLikeToggle && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onLikeToggle();
						}}
						className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
							isLiked
								? 'bg-white text-red-500'
								: 'bg-white/90 text-charcoal-muted hover:text-red-500'
						}`}
						aria-label={isLiked ? 'Unlike recipe' : 'Like recipe'}
					>
						<HeartIcon filled={isLiked} />
					</button>
				)}

				{/* Remove button in top right */}
				{showRemoveButton && onRemove && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onRemove();
						}}
						className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center bg-white/90 text-charcoal-muted hover:text-red-500 hover:bg-white transition-all shadow-sm"
						aria-label="Remove recipe"
					>
						<XIcon />
					</button>
				)}

				{/* Add/Select button */}
				{showSelectButton && onSelect && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onSelect();
						}}
						className={`absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
							isSelected
								? 'bg-primary text-white'
								: 'bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white'
						}`}
						aria-label={
							isSelected ? 'Remove from selection' : 'Add to selection'
						}
					>
						{isSelected ? <CheckIconLarge /> : <PlusIconLarge />}
					</button>
				)}
			</div>

			{/* Content */}
			<div className="p-4">
				{/* Source label */}
				<p className="text-xs font-semibold tracking-wider text-primary uppercase mb-1">
					{getSource(recipe.url)}
				</p>

				{/* Recipe name */}
				<h3 className="font-semibold text-charcoal text-lg leading-tight line-clamp-2 uppercase tracking-wide">
					{recipe.name}
				</h3>

				{/* Time info */}
				{(recipe.prepTime || recipe.cookTime) && (
					<p className="text-sm text-charcoal-muted mt-2">
						{recipe.prepTime && recipe.cookTime
							? `${recipe.prepTime} prep + ${recipe.cookTime} cook`
							: recipe.prepTime || recipe.cookTime}
					</p>
				)}

				{/* Servings */}
				{recipe.servings && (
					<p className="text-sm text-charcoal-muted">
						{recipe.servings} servings
					</p>
				)}
			</div>
		</div>
	);
}

// Full-width recipe detail panel (quick view style)
interface RecipeDetailPanelProps {
	recipe: Recipe;
	onClose: () => void;
	isLiked?: boolean;
	onLikeToggle?: () => void;
}

export function RecipeDetailPanel({
	recipe,
	onClose,
	isLiked = false,
	onLikeToggle,
}: RecipeDetailPanelProps) {
	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden">
			<div className="grid md:grid-cols-2 gap-0">
				{/* Image side */}
				<div className="relative aspect-video md:aspect-auto md:h-full min-h-[300px]">
					{recipe.image ? (
						<Image
							src={recipe.image}
							alt={recipe.name ?? 'Recipe'}
							fill
							className="object-cover"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-cream text-charcoal-muted">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="96"
								height="96"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1"
							>
								<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
								<line x1="6" y1="17" x2="18" y2="17" />
							</svg>
						</div>
					)}
				</div>

				{/* Content side */}
				<div className="p-6 md:p-8 overflow-y-auto max-h-[600px]">
					{/* Header with close button */}
					<div className="flex items-start justify-between mb-4">
						<div className="flex-1">
							<p className="text-xs font-semibold tracking-wider text-primary uppercase mb-1">
								{(() => {
									try {
										return getSource(recipe.url);
									} catch (err) {
										console.log('Error getting source:', err);
										return recipe.url;
									}
								})()}
							</p>
							<h2 className="text-2xl font-bold text-charcoal">
								{recipe.name}
							</h2>
						</div>
						<div className="flex items-center gap-2">
							{onLikeToggle && (
								<button
									onClick={onLikeToggle}
									className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
										isLiked
											? 'bg-red-50 text-red-500'
											: 'bg-cream text-charcoal-muted hover:text-red-500'
									}`}
								>
									<HeartIcon filled={isLiked} />
								</button>
							)}
							<button
								onClick={onClose}
								className="w-10 h-10 rounded-full flex items-center justify-center bg-cream text-charcoal-muted hover:text-charcoal transition-colors"
							>
								<XIcon />
							</button>
						</div>
					</div>

					{/* Meta info */}
					<div className="flex flex-wrap gap-4 mb-6 text-sm text-charcoal-muted">
						{recipe.prepTime && (
							<span className="flex items-center gap-1">
								<svg
									className="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								Prep: {recipe.prepTime}
							</span>
						)}
						{recipe.cookTime && (
							<span className="flex items-center gap-1">
								<svg
									className="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								Cook: {recipe.cookTime}
							</span>
						)}
						{recipe.servings && (
							<span className="flex items-center gap-1">
								<svg
									className="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
								{recipe.servings} servings
							</span>
						)}
					</div>

					{/* Ingredients */}
					{recipe.ingredients && recipe.ingredients.length > 0 && (
						<div className="mb-6">
							<h3 className="font-semibold text-charcoal mb-3">Ingredients</h3>
							<ul className="space-y-2">
								{recipe.ingredients.map((ingredient, idx) => (
									<li
										key={idx}
										className="flex items-start gap-2 text-sm text-charcoal-muted"
									>
										<span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
										<span>{ingredient}</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Instructions */}
					{recipe.instructions && recipe.instructions.length > 0 && (
						<div className="mb-6">
							<h3 className="font-semibold text-charcoal mb-3">Instructions</h3>
							<ol className="space-y-3">
								{recipe.instructions.map((step, idx) => (
									<li
										key={idx}
										className="flex gap-3 text-sm text-charcoal-muted"
									>
										<span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-medium text-xs">
											{idx + 1}
										</span>
										<span className="pt-0.5">{step}</span>
									</li>
								))}
							</ol>
						</div>
					)}

					{/* Notes */}
					{recipe.notes && (
						<div className="mb-6">
							<h3 className="font-semibold text-charcoal mb-2">Notes</h3>
							<p className="text-sm text-charcoal-muted">{recipe.notes}</p>
						</div>
					)}

					{/* Link to original */}
					<a
						href={recipe.url}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
					>
						View original recipe
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
					</a>
				</div>
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
