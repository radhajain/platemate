'use client';

import { RecipeForm } from '@/app/_components/RecipeForm';
import { createClient } from '@/services/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import * as React from 'react';
import {
	scrapeRecipeFromUrl,
	scrapeRecipesFromUrls,
	ScrapeResult,
} from './actions';
import { Recipe } from '../../../../database.types';

type ImportMode = 'url' | 'bulk' | 'manual';

export default function AddRecipePage() {
	const [mode, setMode] = React.useState<ImportMode>('url');
	const [isLoading, setIsLoading] = React.useState(false);
	const [isSaving, setIsSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [success, setSuccess] = React.useState<string | null>(null);

	// URL import state
	const [singleUrl, setSingleUrl] = React.useState('');
	const [bulkUrls, setBulkUrls] = React.useState('');
	const [importResults, setImportResults] = React.useState<ScrapeResult[]>([]);

	// Preview state for single URL import
	const [previewRecipe, setPreviewRecipe] = React.useState<Recipe | null>(null);

	const router = useRouter();
	const supabase = createClient();

	const resetState = () => {
		setError(null);
		setSuccess(null);
		setImportResults([]);
		setPreviewRecipe(null);
	};

	const handleManualSubmit = async (data: {
		name: string;
		image: string;
		prepTime: string;
		cookTime: string;
		servings: string;
		ingredients: string[];
		instructions: string[];
		notes: string;
	}) => {
		setIsLoading(true);
		setError(null);

		try {
			const slug = data.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '');
			const url = `custom://${slug}-${Date.now()}`;

			const { error: insertError } = await supabase.from('recipes').insert({
				url,
				name: data.name,
				image: data.image || null,
				prepTime: data.prepTime || null,
				cookTime: data.cookTime || null,
				servings: data.servings || null,
				ingredients: data.ingredients,
				instructions: data.instructions,
				notes: data.notes || null,
			});

			if (insertError) {
				throw insertError;
			}

			router.push('/recipes');
		} catch (err) {
			console.error('Error saving recipe:', err);
			setError('Failed to save recipe. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSingleUrlImport = async () => {
		if (!singleUrl.trim()) {
			setError('Please enter a URL');
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccess(null);
		setPreviewRecipe(null);

		try {
			const result = await scrapeRecipeFromUrl(singleUrl);

			if (result.success && result.recipe) {
				// Show preview instead of auto-saving
				setPreviewRecipe(result.recipe);
			} else {
				setError(result.error || 'Failed to import recipe');
			}
		} catch (err) {
			console.error('Error importing recipe:', err);
			setError('Failed to import recipe. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSavePreview = async () => {
		if (!previewRecipe) return;

		setIsSaving(true);
		setError(null);

		try {
			const { error: insertError } = await supabase.from('recipes').insert({
				url: previewRecipe.url,
				name: previewRecipe.name,
				image: previewRecipe.image,
				prepTime: previewRecipe.prepTime,
				cookTime: previewRecipe.cookTime,
				servings: previewRecipe.servings,
				ingredients: previewRecipe.ingredients,
				instructions: previewRecipe.instructions,
				notes: previewRecipe.notes,
				ratingAvg: previewRecipe.ratingAvg,
				ratingCount: previewRecipe.ratingCount,
			});

			if (insertError) {
				if (insertError.code === '23505') {
					setError('This recipe has already been added.');
				} else {
					throw insertError;
				}
			} else {
				setSuccess(`Successfully saved "${previewRecipe.name}"!`);
				setSingleUrl('');
				setPreviewRecipe(null);
			}
		} catch (err) {
			console.error('Error saving recipe:', err);
			setError('Failed to save recipe. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancelPreview = () => {
		setPreviewRecipe(null);
		setError(null);
	};

	const handleBulkImport = async () => {
		const urls = bulkUrls
			.split('\n')
			.map((url) => url.trim())
			.filter((url) => url.length > 0);

		if (urls.length === 0) {
			setError('Please enter at least one URL');
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccess(null);
		setImportResults([]);

		try {
			const results = await scrapeRecipesFromUrls(urls);
			setImportResults(results);

			// Save successful results to database
			const successfulRecipes = results
				.filter((r) => r.success && r.recipe)
				.map((r) => ({
					url: r.recipe!.url,
					name: r.recipe!.name,
					image: r.recipe!.image,
					prepTime: r.recipe!.prepTime,
					cookTime: r.recipe!.cookTime,
					servings: r.recipe!.servings,
					ingredients: r.recipe!.ingredients,
					instructions: r.recipe!.instructions,
					notes: r.recipe!.notes,
					ratingAvg: r.recipe!.ratingAvg,
					ratingCount: r.recipe!.ratingCount,
				}));

			if (successfulRecipes.length > 0) {
				const { error: insertError } = await supabase
					.from('recipes')
					.upsert(successfulRecipes, {
						onConflict: 'url',
						ignoreDuplicates: true,
					});

				if (insertError) {
					console.error('Error saving recipes:', insertError);
				}
			}

			const successCount = results.filter((r) => r.success).length;
			const failCount = results.filter((r) => !r.success).length;

			if (successCount > 0) {
				setSuccess(
					`Successfully imported ${successCount} recipe${successCount > 1 ? 's' : ''}.${
						failCount > 0 ? ` ${failCount} failed.` : ''
					}`,
				);
				setBulkUrls('');
			} else {
				setError('All imports failed. See details below.');
			}
		} catch (err) {
			console.error('Error bulk importing recipes:', err);
			setError('Failed to import recipes. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto">
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-charcoal">Add New Recipe</h1>
				<p className="text-charcoal-muted">
					Import from a URL or add your own recipe manually
				</p>
			</div>

			{/* Mode selector */}
			<div className="flex gap-2 mb-6">
				<button
					onClick={() => {
						setMode('url');
						resetState();
					}}
					className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
						mode === 'url'
							? 'bg-green-700 text-white'
							: 'bg-cream-dark text-charcoal hover:bg-cream-darker'
					}`}
				>
					Import URL
				</button>
				<button
					onClick={() => {
						setMode('bulk');
						resetState();
					}}
					className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
						mode === 'bulk'
							? 'bg-green-700 text-white'
							: 'bg-cream-dark text-charcoal hover:bg-cream-darker'
					}`}
				>
					Bulk Import
				</button>
				<button
					onClick={() => {
						setMode('manual');
						resetState();
					}}
					className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
						mode === 'manual'
							? 'bg-green-700 text-white'
							: 'bg-cream-dark text-charcoal hover:bg-cream-darker'
					}`}
				>
					Add Manually
				</button>
			</div>

			{/* Status messages */}
			{error && (
				<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
					{error}
				</div>
			)}

			{success && (
				<div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
					{success}
				</div>
			)}

			{/* Single URL import */}
			{mode === 'url' && (
				<div className="space-y-4">
					{/* URL Input */}
					{!previewRecipe && (
						<div className="bg-white rounded-xl p-6 border border-cream-dark">
							<h2 className="text-lg font-semibold text-charcoal mb-2">
								Import from URL
							</h2>
							<p className="text-sm text-charcoal-muted mb-4">
								Paste a recipe URL from Love and Lemons or NYT Cooking
							</p>

							<div className="flex gap-2">
								<input
									type="url"
									value={singleUrl}
									onChange={(e) => setSingleUrl(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && singleUrl.trim()) {
											handleSingleUrlImport();
										}
									}}
									placeholder="https://cooking.nytimes.com/recipes/..."
									className="flex-1 px-4 py-2 rounded-lg border border-cream-dark focus:outline-none focus:ring-2 focus:ring-green-700"
									disabled={isLoading}
								/>
								<button
									onClick={handleSingleUrlImport}
									disabled={isLoading || !singleUrl.trim()}
									className="px-6 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
								>
									{isLoading && <LoadingSpinner />}
									{isLoading ? 'Loading...' : 'Import'}
								</button>
							</div>

							<div className="mt-4 text-sm text-charcoal-muted">
								<p className="font-medium mb-1">Supported websites:</p>
								<ul className="list-disc list-inside space-y-1">
									<li>Love and Lemons (loveandlemons.com)</li>
									<li>NYT Cooking (cooking.nytimes.com)</li>
								</ul>
							</div>
						</div>
					)}

					{/* Recipe Preview */}
					{previewRecipe && (
						<div className="bg-white rounded-xl border border-cream-dark overflow-hidden">
							<div className="p-4 bg-cream-light border-b border-cream-dark">
								<h2 className="text-lg font-semibold text-charcoal">
									Preview Recipe
								</h2>
								<p className="text-sm text-charcoal-muted">
									Review the imported recipe before saving
								</p>
							</div>

							<div className="p-6">
								{/* Header with image */}
								<div className="flex gap-4 mb-6">
									{previewRecipe.image && (
										<div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
											<Image
												src={previewRecipe.image}
												alt={previewRecipe.name || 'Recipe'}
												fill
												className="object-cover"
												unoptimized
											/>
										</div>
									)}
									<div className="flex-1 min-w-0">
										<h3 className="text-xl font-bold text-charcoal mb-2">
											{previewRecipe.name}
										</h3>
										<div className="flex flex-wrap gap-3 text-sm text-charcoal-muted">
											{previewRecipe.prepTime && (
												<span>Prep: {previewRecipe.prepTime}</span>
											)}
											{previewRecipe.cookTime && (
												<span>Cook: {previewRecipe.cookTime}</span>
											)}
											{previewRecipe.servings && (
												<span>Serves: {previewRecipe.servings}</span>
											)}
											{previewRecipe.ratingAvg && (
												<span>
													Rating: {previewRecipe.ratingAvg}
													{previewRecipe.ratingCount &&
														` (${previewRecipe.ratingCount})`}
												</span>
											)}
										</div>
									</div>
								</div>

								{/* Ingredients */}
								{previewRecipe.ingredients &&
									previewRecipe.ingredients.length > 0 && (
										<div className="mb-6">
											<h4 className="text-sm font-semibold text-charcoal uppercase tracking-wide mb-2">
												Ingredients ({previewRecipe.ingredients.length})
											</h4>
											<ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-charcoal-muted">
												{previewRecipe.ingredients
													.slice(0, 8)
													.map((ingredient, i) => (
														<li key={i} className="truncate">
															• {ingredient}
														</li>
													))}
												{previewRecipe.ingredients.length > 8 && (
													<li className="text-charcoal-muted italic">
														...and {previewRecipe.ingredients.length - 8} more
													</li>
												)}
											</ul>
										</div>
									)}

								{/* Instructions */}
								{previewRecipe.instructions &&
									previewRecipe.instructions.length > 0 && (
										<div className="mb-6">
											<h4 className="text-sm font-semibold text-charcoal uppercase tracking-wide mb-2">
												Instructions ({previewRecipe.instructions.length} steps)
											</h4>
											<ol className="space-y-1 text-sm text-charcoal-muted">
												{previewRecipe.instructions
													.slice(0, 3)
													.map((step, i) => (
														<li key={i} className="line-clamp-2">
															{i + 1}. {step}
														</li>
													))}
												{previewRecipe.instructions.length > 3 && (
													<li className="text-charcoal-muted italic">
														...and {previewRecipe.instructions.length - 3} more
														steps
													</li>
												)}
											</ol>
										</div>
									)}

								{/* Notes */}
								{previewRecipe.notes && (
									<div className="mb-6">
										<h4 className="text-sm font-semibold text-charcoal uppercase tracking-wide mb-2">
											Notes
										</h4>
										<p className="text-sm text-charcoal-muted line-clamp-3">
											{previewRecipe.notes}
										</p>
									</div>
								)}

								{/* Action buttons */}
								<div className="flex gap-3 pt-4 border-t border-cream-dark">
									<button
										onClick={handleCancelPreview}
										disabled={isSaving}
										className="flex-1 px-4 py-2 border border-cream-dark text-charcoal rounded-lg font-medium hover:bg-cream-light transition-colors disabled:opacity-50"
									>
										Cancel
									</button>
									<button
										onClick={handleSavePreview}
										disabled={isSaving}
										className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-700-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
									>
										{isSaving && <LoadingSpinner />}
										{isSaving ? 'Saving...' : 'Save Recipe'}
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Bulk URL import */}
			{mode === 'bulk' && (
				<div className="space-y-4">
					<div className="bg-white rounded-xl p-6 border border-cream-dark">
						<h2 className="text-lg font-semibold text-charcoal mb-2">
							Bulk Import
						</h2>
						<p className="text-sm text-charcoal-muted mb-4">
							Paste multiple recipe URLs, one per line
						</p>

						<textarea
							value={bulkUrls}
							onChange={(e) => setBulkUrls(e.target.value)}
							placeholder={`https://cooking.nytimes.com/recipes/...\nhttps://www.loveandlemons.com/...\nhttps://cooking.nytimes.com/recipes/...`}
							rows={6}
							className="w-full px-4 py-3 rounded-lg border border-cream-dark focus:outline-none focus:ring-2 focus:ring-green-700 resize-none font-mono text-sm"
							disabled={isLoading}
						/>

						<button
							onClick={handleBulkImport}
							disabled={isLoading || !bulkUrls.trim()}
							className="mt-4 w-full px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:bg-green-700-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{isLoading && <LoadingSpinner />}
							{isLoading ? 'Importing...' : 'Import All'}
						</button>

						<div className="mt-4 text-sm text-charcoal-muted">
							<p className="font-medium mb-1">Supported websites:</p>
							<ul className="list-disc list-inside space-y-1">
								<li>Love and Lemons (loveandlemons.com)</li>
								<li>NYT Cooking (cooking.nytimes.com)</li>
							</ul>
						</div>
					</div>

					{/* Import results */}
					{importResults.length > 0 && (
						<div className="bg-white rounded-xl p-6 border border-cream-dark">
							<h3 className="text-lg font-semibold text-charcoal mb-4">
								Import Results
							</h3>
							<div className="space-y-3">
								{importResults.map((result, index) => (
									<div
										key={index}
										className={`p-3 rounded-lg ${
											result.success
												? 'bg-green-50 border border-green-200'
												: 'bg-red-50 border border-red-200'
										}`}
									>
										<div className="flex items-start gap-2">
											<span
												className={`text-lg ${
													result.success ? 'text-green-600' : 'text-red-600'
												}`}
											>
												{result.success ? '✓' : '✗'}
											</span>
											<div className="flex-1 min-w-0">
												{result.success && result.recipe ? (
													<p className="font-medium text-green-800 truncate">
														{result.recipe.name}
													</p>
												) : (
													<>
														<p className="text-sm text-red-800 truncate">
															{result.url}
														</p>
														<p className="text-sm text-red-600 mt-1">
															{result.error}
														</p>
													</>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Manual entry form */}
			{mode === 'manual' && (
				<RecipeForm onSubmit={handleManualSubmit} isLoading={isLoading} />
			)}
		</div>
	);
}

function LoadingSpinner() {
	return (
		<svg
			className="animate-spin h-4 w-4"
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
	);
}
