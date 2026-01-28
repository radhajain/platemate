'use client';

import { generateMealPrepInstructions } from '@/services/supabase/api';
import { PrepPhase, PrepTask } from '@/utilities/prompts/mealPrepInstructions';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { Recipe } from '../../../database.types';
import { Button } from './Button';

interface MealPrepInstructionsProps {
	recipes: readonly Recipe[];
}

export function MealPrepInstructions({ recipes }: MealPrepInstructionsProps) {
	const [expandedPhases, setExpandedPhases] = React.useState<Set<string>>(
		new Set(),
	);
	const [completedTasks, setCompletedTasks] = React.useState<Set<string>>(
		new Set(),
	);

	// Load completed tasks from localStorage on mount
	React.useEffect(() => {
		const stored = localStorage.getItem('mealPrepCompletedTasks');
		if (stored) {
			try {
				setCompletedTasks(new Set(JSON.parse(stored)));
			} catch {
				// Ignore parse errors
			}
		}
		// Expand all phases by default
		setExpandedPhases(
			new Set([
				'Prep & Wash',
				'Chop & Dice',
				'Marinate & Season',
				'Cook Grains & Bases',
				'Pre-Cook Proteins',
				'Make Sauces & Dressings',
				'Assemble & Store',
			]),
		);
	}, []);

	// Save completed tasks to localStorage
	React.useEffect(() => {
		localStorage.setItem(
			'mealPrepCompletedTasks',
			JSON.stringify(Array.from(completedTasks)),
		);
	}, [completedTasks]);

	const {
		data: prepInstructions,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ['mealPrepInstructions', recipes.map((r) => r.url).join(',')],
		queryFn: async () => {
			return await generateMealPrepInstructions([...recipes]);
		},
		enabled: recipes.length > 0,
		staleTime: 1000 * 60 * 10, // Cache for 10 minutes
	});

	const togglePhase = (phaseName: string) => {
		setExpandedPhases((prev) => {
			const next = new Set(prev);
			if (next.has(phaseName)) {
				next.delete(phaseName);
			} else {
				next.add(phaseName);
			}
			return next;
		});
	};

	const toggleTask = (taskKey: string) => {
		setCompletedTasks((prev) => {
			const next = new Set(prev);
			if (next.has(taskKey)) {
				next.delete(taskKey);
			} else {
				next.add(taskKey);
			}
			return next;
		});
	};

	const clearCompleted = () => {
		setCompletedTasks(new Set());
		localStorage.removeItem('mealPrepCompletedTasks');
	};

	const copyToClipboard = async () => {
		if (!prepInstructions) return;

		let text = `SUNDAY MEAL PREP PLAN\n`;
		text += `Estimated Total Time: ${prepInstructions.totalEstimatedTime}\n\n`;

		prepInstructions.phases.forEach((phase) => {
			text += `=== ${phase.name} (${phase.estimatedDuration}) ===\n`;
			phase.tasks.forEach((task) => {
				const parallel = task.canBeParallelized ? ' [can run in parallel]' : '';
				text += `[ ] ${task.task} (${task.duration}) - for: ${task.forRecipe}${parallel}\n`;
				if (task.notes) {
					text += `    Note: ${task.notes}\n`;
				}
			});
			text += '\n';
		});

		if (prepInstructions.storageInstructions.length > 0) {
			text += `=== STORAGE INSTRUCTIONS ===\n`;
			prepInstructions.storageInstructions.forEach((instruction) => {
				text += `- ${instruction}\n`;
			});
			text += '\n';
		}

		if (prepInstructions.tips.length > 0) {
			text += `=== TIPS ===\n`;
			prepInstructions.tips.forEach((tip) => {
				text += `- ${tip}\n`;
			});
		}

		try {
			await navigator.clipboard.writeText(text);
			alert('Meal prep plan copied to clipboard!');
		} catch {
			console.error('Failed to copy to clipboard');
		}
	};

	if (recipes.length === 0) {
		return (
			<div className="bg-white rounded-xl p-6 sm:p-8 text-center">
				<p className="text-charcoal-muted">
					No recipes selected. Generate a meal plan to see your prep
					instructions.
				</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="bg-white rounded-xl p-6 sm:p-8">
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
						Creating your meal prep plan...
					</span>
				</div>
			</div>
		);
	}

	if (isError || !prepInstructions) {
		return (
			<div className="bg-white rounded-xl p-6 sm:p-8 text-center">
				<p className="text-red-500 mb-4">
					Failed to generate meal prep instructions. Please try again.
				</p>
				<Button variant="primary" onClick={() => refetch()}>
					Retry
				</Button>
			</div>
		);
	}

	const totalTasks = prepInstructions.phases.reduce(
		(sum, phase) => sum + phase.tasks.length,
		0,
	);
	const completedCount = completedTasks.size;

	return (
		<div className="bg-white rounded-xl overflow-hidden">
			{/* Header */}
			<div className="p-4 border-b border-cream-dark bg-gradient-to-r from-primary/5 to-primary/10">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<div className="flex items-center gap-2">
							<ClockIcon />
							<h2 className="text-lg sm:text-xl font-semibold text-charcoal">
								Sunday Meal Prep
							</h2>
						</div>
						<p className="text-sm text-charcoal-muted mt-1">
							Est. time:{' '}
							<span className="font-medium text-primary">
								{prepInstructions.totalEstimatedTime}
							</span>{' '}
							&bull; {completedCount} of {totalTasks} tasks done
						</p>
					</div>
					<div className="flex gap-2">
						<Button variant="ghost" onClick={clearCompleted}>
							<span className="hidden sm:inline">Reset Progress</span>
							<span className="sm:hidden">Reset</span>
						</Button>
						<Button variant="primary" onClick={copyToClipboard}>
							<span className="hidden sm:inline">Copy Plan</span>
							<span className="sm:hidden">Copy</span>
						</Button>
					</div>
				</div>
			</div>

			{/* Progress bar */}
			{totalTasks > 0 && (
				<div className="px-4 py-2 bg-cream-light">
					<div className="h-2 bg-cream-dark rounded-full overflow-hidden">
						<div
							className="h-full bg-primary transition-all duration-300"
							style={{ width: `${(completedCount / totalTasks) * 100}%` }}
						/>
					</div>
				</div>
			)}

			{/* Phases */}
			<div className="divide-y divide-cream-dark">
				{prepInstructions.phases.map((phase) => (
					<PhaseSection
						key={phase.name}
						phase={phase}
						isExpanded={expandedPhases.has(phase.name)}
						onToggle={() => togglePhase(phase.name)}
						completedTasks={completedTasks}
						onToggleTask={toggleTask}
					/>
				))}
			</div>

			{/* Storage Instructions */}
			{prepInstructions.storageInstructions.length > 0 && (
				<div className="p-4 bg-blue-50 border-t border-blue-100">
					<h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
						<StorageIcon />
						Storage Instructions
					</h3>
					<ul className="text-sm text-blue-700 space-y-1">
						{prepInstructions.storageInstructions.map((instruction, i) => (
							<li key={i} className="flex items-start gap-2">
								<span className="text-blue-400 mt-1">•</span>
								{instruction}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Tips */}
			{prepInstructions.tips.length > 0 && (
				<div className="p-4 bg-yellow-50 border-t border-yellow-100">
					<h3 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
						<TipIcon />
						Pro Tips
					</h3>
					<ul className="text-sm text-yellow-700 space-y-1">
						{prepInstructions.tips.map((tip, i) => (
							<li key={i} className="flex items-start gap-2">
								<span className="text-yellow-400 mt-1">•</span>
								{tip}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

interface PhaseSectionProps {
	phase: PrepPhase;
	isExpanded: boolean;
	onToggle: () => void;
	completedTasks: Set<string>;
	onToggleTask: (key: string) => void;
}

function PhaseSection({
	phase,
	isExpanded,
	onToggle,
	completedTasks,
	onToggleTask,
}: PhaseSectionProps) {
	const completedCount = phase.tasks.filter((task) =>
		completedTasks.has(`${phase.name}-${task.task}`),
	).length;
	const allCompleted =
		completedCount === phase.tasks.length && phase.tasks.length > 0;

	return (
		<div>
			<button
				onClick={onToggle}
				className={`w-full px-4 py-3 flex items-center justify-between hover:bg-cream-light transition-colors ${
					allCompleted ? 'bg-green-50' : ''
				}`}
			>
				<div className="flex items-center gap-3">
					<span
						className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
					>
						<ChevronRight />
					</span>
					<span
						className={`font-medium ${allCompleted ? 'text-green-700' : 'text-charcoal'}`}
					>
						{phase.name}
					</span>
					<span className="text-xs px-2 py-0.5 bg-charcoal-muted/10 text-charcoal-muted rounded-full">
						{phase.estimatedDuration}
					</span>
					<span className="text-sm text-charcoal-muted">
						({completedCount}/{phase.tasks.length})
					</span>
				</div>
				{allCompleted && (
					<span className="text-green-600">
						<CheckCircleIcon />
					</span>
				)}
			</button>

			{isExpanded && (
				<div className="px-4 pb-3 space-y-2">
					{phase.tasks.map((task) => (
						<TaskItem
							key={`${phase.name}-${task.task}`}
							task={task}
							phaseName={phase.name}
							isCompleted={completedTasks.has(`${phase.name}-${task.task}`)}
							onToggle={() => onToggleTask(`${phase.name}-${task.task}`)}
						/>
					))}
				</div>
			)}
		</div>
	);
}

interface TaskItemProps {
	task: PrepTask;
	phaseName: string;
	isCompleted: boolean;
	onToggle: () => void;
}

function TaskItem({ task, isCompleted, onToggle }: TaskItemProps) {
	return (
		<div
			className={`p-3 rounded-lg border transition-colors cursor-pointer ${
				isCompleted
					? 'bg-green-50 border-green-200'
					: 'bg-white border-cream-dark hover:border-primary'
			}`}
			onClick={onToggle}
		>
			<div className="flex items-start gap-3">
				<div
					className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
						isCompleted
							? 'bg-green-500 border-green-500 text-white'
							: 'border-charcoal-muted'
					}`}
				>
					{isCompleted && <CheckIcon />}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<span
							className={`font-medium ${
								isCompleted
									? 'line-through text-charcoal-muted'
									: 'text-charcoal'
							}`}
						>
							{task.task}
						</span>
						<span className="text-xs px-2 py-0.5 bg-charcoal-muted/10 text-charcoal-muted rounded-full">
							{task.duration}
						</span>
						{task.canBeParallelized && (
							<span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full flex items-center gap-1">
								<ParallelIcon />
								<span className="hidden sm:inline">Parallel</span>
							</span>
						)}
					</div>
					<p className="text-sm text-charcoal-muted mt-1">
						For: {task.forRecipe}
					</p>
					{task.notes && (
						<p className="text-xs text-charcoal-muted mt-1 italic">
							{task.notes}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

// Icons
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

function CheckCircleIcon() {
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
			<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
			<polyline points="22 4 12 14.01 9 11.01" />
		</svg>
	);
}

function ClockIcon() {
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
			className="text-primary"
		>
			<circle cx="12" cy="12" r="10" />
			<polyline points="12 6 12 12 16 14" />
		</svg>
	);
}

function StorageIcon() {
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
			<path d="M5 3a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5z" />
			<path d="M8 10h8" />
			<path d="M8 14h4" />
		</svg>
	);
}

function TipIcon() {
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
			<path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
		</svg>
	);
}

function ParallelIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="12"
			height="12"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M8 6h13" />
			<path d="M8 12h13" />
			<path d="M8 18h13" />
			<path d="M3 6h.01" />
			<path d="M3 12h.01" />
			<path d="M3 18h.01" />
		</svg>
	);
}
