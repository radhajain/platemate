'use client';

import { getUserProfile, saveUserProfile } from '@/services/supabase/api';
import { createClient } from '@/services/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const DIETARY_OPTIONS = [
	{ value: 'vegetarian', label: 'Vegetarian', description: 'No meat, poultry, or fish' },
	{ value: 'vegan', label: 'Vegan', description: 'No animal products' },
	{ value: 'pescatarian', label: 'Pescatarian', description: 'Fish OK, no meat/poultry' },
	{ value: 'gluten-free', label: 'Gluten-Free', description: 'No wheat, barley, rye' },
	{ value: 'dairy-free', label: 'Dairy-Free', description: 'No milk, cheese, butter' },
	{ value: 'nut-free', label: 'Nut-Free', description: 'No tree nuts or peanuts' },
	{ value: 'low-carb', label: 'Low Carb', description: 'Minimal carbohydrates' },
	{ value: 'keto', label: 'Keto', description: 'Very low carb, high fat' },
	{ value: 'paleo', label: 'Paleo', description: 'No grains, legumes, dairy' },
	{ value: 'no-red-meat', label: 'No Red Meat', description: 'No beef, pork, lamb' },
	{ value: 'no-pork', label: 'No Pork', description: 'No pork products' },
	{ value: 'no-shellfish', label: 'No Shellfish', description: 'No shrimp, crab, lobster' },
	{ value: 'halal', label: 'Halal', description: 'Islamic dietary law' },
	{ value: 'kosher', label: 'Kosher', description: 'Jewish dietary law' },
];

export default function ProfilePage() {
	const router = useRouter();
	const [firstName, setFirstName] = useState('');
	const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
	const [weeklyStaples, setWeeklyStaples] = useState<string[]>([]);
	const [newStaple, setNewStaple] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [userId, setUserId] = useState<string | null>(null);

	useEffect(() => {
		async function loadProfile() {
			const supabase = createClient();
			const { data: { user } } = await supabase.auth.getUser();

			if (!user) {
				router.push('/login');
				return;
			}

			setUserId(user.id);

			const profile = await getUserProfile(user.id);
			if (profile) {
				setFirstName(profile.first_name || '');
				setSelectedPreferences(profile.dietary_preferences || []);
				setWeeklyStaples(profile.weekly_staples || []);
			}
			setLoading(false);
		}

		loadProfile();
	}, [router]);

	const togglePreference = (value: string) => {
		setSelectedPreferences((prev) =>
			prev.includes(value)
				? prev.filter((p) => p !== value)
				: [...prev, value]
		);
	};

	const addStaple = () => {
		const trimmed = newStaple.trim();
		if (trimmed && !weeklyStaples.includes(trimmed)) {
			setWeeklyStaples((prev) => [...prev, trimmed]);
			setNewStaple('');
		}
	};

	const removeStaple = (staple: string) => {
		setWeeklyStaples((prev) => prev.filter((s) => s !== staple));
	};

	const handleSave = async () => {
		if (!userId) return;

		setSaving(true);
		await saveUserProfile(userId, {
			firstName,
			dietaryPreferences: selectedPreferences,
			weeklyStaples,
		});
		setSaving(false);
		router.push('/recipes');
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-charcoal-muted">Loading...</div>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto">
			<div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 shadow-sm">
				<h1 className="text-xl sm:text-2xl font-bold text-charcoal mb-2">Your Profile</h1>
				<p className="text-charcoal-muted mb-6 sm:mb-8 text-sm sm:text-base">
					Set your preferences to see recipes that match your dietary needs.
				</p>

				{/* First Name */}
				<div className="mb-8">
					<label
						htmlFor="firstName"
						className="block text-sm font-medium text-charcoal mb-2"
					>
						First Name
					</label>
					<input
						type="text"
						id="firstName"
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
						placeholder="Enter your first name"
						className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
					/>
				</div>

				{/* Dietary Preferences */}
				<div className="mb-6 sm:mb-8">
					<label className="block text-sm font-medium text-charcoal mb-3 sm:mb-4">
						Dietary Preferences
					</label>
					<p className="text-sm text-charcoal-muted mb-4">
						Select all that apply. Only recipes matching ALL your preferences will be shown.
					</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{DIETARY_OPTIONS.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => togglePreference(option.value)}
								className={`p-4 rounded-lg border-2 text-left transition-all ${
									selectedPreferences.includes(option.value)
										? 'border-primary bg-primary/5'
										: 'border-gray-200 hover:border-gray-300'
								}`}
							>
								<div className="flex items-center gap-3">
									<div
										className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
											selectedPreferences.includes(option.value)
												? 'border-primary bg-primary'
												: 'border-gray-300'
										}`}
									>
										{selectedPreferences.includes(option.value) && (
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="white"
												className="w-3 h-3"
											>
												<path
													fillRule="evenodd"
													d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
													clipRule="evenodd"
												/>
											</svg>
										)}
									</div>
									<div>
										<div className="font-medium text-charcoal">
											{option.label}
										</div>
										<div className="text-xs text-charcoal-muted">
											{option.description}
										</div>
									</div>
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Weekly Staples */}
				<div className="mb-8">
					<label className="block text-sm font-medium text-charcoal mb-2">
						Weekly Staples
					</label>
					<p className="text-sm text-charcoal-muted mb-4">
						Items that automatically get added to your grocery list every week (e.g., milk, eggs, bread).
					</p>
					<div className="flex gap-2 mb-3">
						<input
							type="text"
							value={newStaple}
							onChange={(e) => setNewStaple(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									addStaple();
								}
							}}
							placeholder="Add a staple item..."
							className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
						/>
						<button
							type="button"
							onClick={addStaple}
							className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
						>
							Add
						</button>
					</div>
					{weeklyStaples.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{weeklyStaples.map((staple) => (
								<span
									key={staple}
									className="inline-flex items-center gap-1 px-3 py-1.5 bg-cream rounded-full text-sm text-charcoal"
								>
									{staple}
									<button
										type="button"
										onClick={() => removeStaple(staple)}
										className="w-4 h-4 rounded-full hover:bg-charcoal/10 flex items-center justify-center"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											className="w-3 h-3"
										>
											<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
										</svg>
									</button>
								</span>
							))}
						</div>
					)}
				</div>

				{/* Save Button */}
				<button
					onClick={handleSave}
					disabled={saving}
					className="w-full btn-primary-filled disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{saving ? 'Saving...' : 'Save Preferences'}
				</button>
			</div>
		</div>
	);
}
