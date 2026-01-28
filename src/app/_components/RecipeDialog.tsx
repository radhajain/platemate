'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Recipe } from '../../../database.types';
import { X, Clock, Users, ExternalLink, Heart } from 'lucide-react';

interface RecipeDialogProps {
	recipe: Recipe | null;
	isOpen: boolean;
	onClose: () => void;
	isLiked?: boolean;
	onLikeToggle?: () => void;
}

export function RecipeDialog({
	recipe,
	isOpen,
	onClose,
	isLiked = false,
	onLikeToggle,
}: RecipeDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		if (isOpen) {
			dialog.showModal();
			document.body.style.overflow = 'hidden';
		} else {
			dialog.close();
			document.body.style.overflow = '';
		}

		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	const handleBackdropClick = useCallback(
		(e: React.MouseEvent<HTMLDialogElement>) => {
			if (e.target === dialogRef.current) {
				onClose();
			}
		},
		[onClose],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		},
		[onClose],
	);

	if (!recipe) return null;

	return (
		<dialog
			ref={dialogRef}
			onClick={handleBackdropClick}
			onKeyDown={handleKeyDown}
			className="fixed inset-0 z-50 m-0 h-full w-full max-h-full max-w-full bg-transparent backdrop:bg-black/50"
		>
			<div className="flex items-center justify-center min-h-full p-4">
				<div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
					{/* Header with image */}
					<div className="relative">
						{recipe.image ? (
							<div className="relative h-48 sm:h-64 overflow-hidden">
								<img
									src={recipe.image}
									alt={recipe.name || ''}
									className="w-full h-full object-cover"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
								<div className="absolute bottom-4 left-4 right-4">
									<h2 className="text-xl sm:text-2xl font-bold text-white">
										{recipe.name}
									</h2>
								</div>
							</div>
						) : (
							<div className="p-4 sm:p-6 pb-0">
								<h2 className="text-xl sm:text-2xl font-bold text-charcoal">
									{recipe.name}
								</h2>
							</div>
						)}

						{/* Close button */}
						<button
							onClick={onClose}
							className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-charcoal transition-colors shadow-md"
							aria-label="Close dialog"
						>
							<X className="w-5 h-5" />
						</button>

						{/* Like button */}
						{onLikeToggle && (
							<button
								onClick={(e) => {
									e.stopPropagation();
									onLikeToggle();
								}}
								className={`absolute top-3 right-14 p-2 rounded-full transition-colors shadow-md ${
									isLiked
										? 'bg-red-500 text-white hover:bg-red-600'
										: 'bg-white/90 hover:bg-white text-charcoal'
								}`}
								aria-label={isLiked ? 'Unlike recipe' : 'Like recipe'}
							>
								<Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
							</button>
						)}
					</div>

					{/* Content */}
					<div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-16rem)]">
						{/* Meta info */}
						<div className="flex flex-wrap gap-4 mb-6">
							{recipe.prepTime && (
								<div className="flex items-center gap-1.5 text-sm text-charcoal-muted">
									<Clock className="w-4 h-4" />
									<span>Prep: {recipe.prepTime}</span>
								</div>
							)}
							{recipe.cookTime && (
								<div className="flex items-center gap-1.5 text-sm text-charcoal-muted">
									<Clock className="w-4 h-4" />
									<span>Cook: {recipe.cookTime}</span>
								</div>
							)}
							{recipe.servings && (
								<div className="flex items-center gap-1.5 text-sm text-charcoal-muted">
									<Users className="w-4 h-4" />
									<span>{recipe.servings}</span>
								</div>
							)}
						</div>

						{/* Dietary tags */}
						{recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
							<div className="flex flex-wrap gap-2 mb-6">
								{recipe.dietary_tags.map((tag) => (
									<span
										key={tag}
										className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
									>
										{tag}
									</span>
								))}
							</div>
						)}

						{/* Ingredients */}
						{recipe.ingredients && recipe.ingredients.length > 0 && (
							<div className="mb-6">
								<h3 className="text-lg font-semibold text-charcoal mb-3">
									Ingredients
								</h3>
								<ul className="space-y-2">
									{recipe.ingredients.map((ingredient, index) => (
										<li
											key={index}
											className="flex items-start gap-2 text-sm text-charcoal"
										>
											<span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
											{ingredient}
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Instructions */}
						{recipe.instructions && recipe.instructions.length > 0 && (
							<div className="mb-6">
								<h3 className="text-lg font-semibold text-charcoal mb-3">
									Instructions
								</h3>
								<ol className="space-y-4">
									{recipe.instructions.map((step, index) => (
										<li key={index} className="flex gap-4">
											<span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-sm font-medium flex items-center justify-center">
												{index + 1}
											</span>
											<p className="text-sm text-charcoal pt-1">{step}</p>
										</li>
									))}
								</ol>
							</div>
						)}

						{/* Source link */}
						{recipe.url && (
							<div className="pt-4 border-t border-cream-dark">
								<a
									href={recipe.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-dark transition-colors font-medium"
								>
									<ExternalLink className="w-4 h-4" />
									View original recipe
								</a>
							</div>
						)}
					</div>
				</div>
			</div>
		</dialog>
	);
}
