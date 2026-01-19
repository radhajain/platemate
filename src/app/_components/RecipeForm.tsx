'use client';

import * as React from 'react';
import { Button } from './Button';

interface RecipeFormData {
	name: string;
	image: string;
	prepTime: string;
	cookTime: string;
	servings: string;
	ingredients: string[];
	instructions: string[];
	notes: string;
}

interface RecipeFormProps {
	onSubmit: (data: RecipeFormData) => Promise<void>;
	isLoading?: boolean;
}

export function RecipeForm({ onSubmit, isLoading = false }: RecipeFormProps) {
	const [formData, setFormData] = React.useState<RecipeFormData>({
		name: '',
		image: '',
		prepTime: '',
		cookTime: '',
		servings: '',
		ingredients: [''],
		instructions: [''],
		notes: '',
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		// Filter out empty ingredients and instructions
		const cleanedData = {
			...formData,
			ingredients: formData.ingredients.filter((i) => i.trim() !== ''),
			instructions: formData.instructions.filter((i) => i.trim() !== ''),
		};
		await onSubmit(cleanedData);
	};

	const addIngredient = () => {
		setFormData((prev) => ({
			...prev,
			ingredients: [...prev.ingredients, ''],
		}));
	};

	const removeIngredient = (index: number) => {
		setFormData((prev) => ({
			...prev,
			ingredients: prev.ingredients.filter((_, i) => i !== index),
		}));
	};

	const updateIngredient = (index: number, value: string) => {
		setFormData((prev) => ({
			...prev,
			ingredients: prev.ingredients.map((item, i) =>
				i === index ? value : item
			),
		}));
	};

	const addInstruction = () => {
		setFormData((prev) => ({
			...prev,
			instructions: [...prev.instructions, ''],
		}));
	};

	const removeInstruction = (index: number) => {
		setFormData((prev) => ({
			...prev,
			instructions: prev.instructions.filter((_, i) => i !== index),
		}));
	};

	const updateInstruction = (index: number, value: string) => {
		setFormData((prev) => ({
			...prev,
			instructions: prev.instructions.map((item, i) =>
				i === index ? value : item
			),
		}));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Basic Info */}
			<div className="bg-white rounded-xl p-6 space-y-4">
				<h2 className="text-lg font-semibold text-charcoal">Basic Info</h2>

				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-charcoal mb-1"
					>
						Recipe Name *
					</label>
					<input
						type="text"
						id="name"
						required
						value={formData.name}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, name: e.target.value }))
						}
						className="w-full px-4 py-2.5 border-2 border-cream-dark rounded-lg focus:border-primary focus:outline-none transition-colors"
						placeholder="e.g., Lemon Garlic Pasta"
					/>
				</div>

				<div>
					<label
						htmlFor="image"
						className="block text-sm font-medium text-charcoal mb-1"
					>
						Image URL
					</label>
					<input
						type="url"
						id="image"
						value={formData.image}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, image: e.target.value }))
						}
						className="w-full px-4 py-2.5 border-2 border-cream-dark rounded-lg focus:border-primary focus:outline-none transition-colors"
						placeholder="https://example.com/image.jpg"
					/>
				</div>

				<div className="grid grid-cols-3 gap-4">
					<div>
						<label
							htmlFor="prepTime"
							className="block text-sm font-medium text-charcoal mb-1"
						>
							Prep Time
						</label>
						<input
							type="text"
							id="prepTime"
							value={formData.prepTime}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, prepTime: e.target.value }))
							}
							className="w-full px-4 py-2.5 border-2 border-cream-dark rounded-lg focus:border-primary focus:outline-none transition-colors"
							placeholder="15 mins"
						/>
					</div>
					<div>
						<label
							htmlFor="cookTime"
							className="block text-sm font-medium text-charcoal mb-1"
						>
							Cook Time
						</label>
						<input
							type="text"
							id="cookTime"
							value={formData.cookTime}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, cookTime: e.target.value }))
							}
							className="w-full px-4 py-2.5 border-2 border-cream-dark rounded-lg focus:border-primary focus:outline-none transition-colors"
							placeholder="30 mins"
						/>
					</div>
					<div>
						<label
							htmlFor="servings"
							className="block text-sm font-medium text-charcoal mb-1"
						>
							Servings
						</label>
						<input
							type="text"
							id="servings"
							value={formData.servings}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, servings: e.target.value }))
							}
							className="w-full px-4 py-2.5 border-2 border-cream-dark rounded-lg focus:border-primary focus:outline-none transition-colors"
							placeholder="4"
						/>
					</div>
				</div>
			</div>

			{/* Ingredients */}
			<div className="bg-white rounded-xl p-6 space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-charcoal">Ingredients *</h2>
					<Button type="button" variant="ghost" onClick={addIngredient}>
						+ Add Ingredient
					</Button>
				</div>

				<div className="space-y-2">
					{formData.ingredients.map((ingredient, index) => (
						<div key={index} className="flex gap-2">
							<input
								type="text"
								value={ingredient}
								onChange={(e) => updateIngredient(index, e.target.value)}
								className="flex-1 px-4 py-2.5 border-2 border-cream-dark rounded-lg focus:border-primary focus:outline-none transition-colors"
								placeholder={`e.g., 2 cups flour`}
							/>
							{formData.ingredients.length > 1 && (
								<button
									type="button"
									onClick={() => removeIngredient(index)}
									className="p-2.5 text-charcoal-muted hover:text-red-500 transition-colors"
								>
									<TrashIcon />
								</button>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Instructions */}
			<div className="bg-white rounded-xl p-6 space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-charcoal">Instructions</h2>
					<Button type="button" variant="ghost" onClick={addInstruction}>
						+ Add Step
					</Button>
				</div>

				<div className="space-y-2">
					{formData.instructions.map((instruction, index) => (
						<div key={index} className="flex gap-2">
							<span className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-sm font-medium text-charcoal-muted">
								{index + 1}.
							</span>
							<textarea
								value={instruction}
								onChange={(e) => updateInstruction(index, e.target.value)}
								className="flex-1 px-4 py-2.5 border-2 border-cream-dark rounded-lg focus:border-primary focus:outline-none transition-colors resize-none"
								rows={2}
								placeholder={`Step ${index + 1}...`}
							/>
							{formData.instructions.length > 1 && (
								<button
									type="button"
									onClick={() => removeInstruction(index)}
									className="p-2.5 text-charcoal-muted hover:text-red-500 transition-colors"
								>
									<TrashIcon />
								</button>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Notes */}
			<div className="bg-white rounded-xl p-6 space-y-4">
				<h2 className="text-lg font-semibold text-charcoal">Notes</h2>
				<textarea
					value={formData.notes}
					onChange={(e) =>
						setFormData((prev) => ({ ...prev, notes: e.target.value }))
					}
					className="w-full px-4 py-2.5 border-2 border-cream-dark rounded-lg focus:border-primary focus:outline-none transition-colors resize-none"
					rows={3}
					placeholder="Any additional tips or variations..."
				/>
			</div>

			{/* Submit */}
			<div className="flex justify-end">
				<Button type="submit" variant="primary-filled" isLoading={isLoading}>
					Save Recipe
				</Button>
			</div>
		</form>
	);
}

function TrashIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="3 6 5 6 21 6" />
			<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
			<line x1="10" y1="11" x2="10" y2="17" />
			<line x1="14" y1="11" x2="14" y2="17" />
		</svg>
	);
}
