'use client';

import { generateMealPrepInstructions } from '@/services/supabase/api';
import { PrepPhase, PrepTask } from '@/utilities/prompts/mealPrepInstructions';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { Recipe } from '../../../database.types';
import { Button } from './Button';
import {
	Copy,
	RotateCcw,
	ChevronRight,
	Check,
	CheckCircle,
	Clock,
	Droplets,
	Scissors,
	Flame,
	Wheat,
	Beef,
	FlaskConical,
	Package,
	Info,
	Lightbulb,
	ChevronsUpDown,
} from 'lucide-react';

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

	const allPhaseNames = React.useMemo(() => {
		return prepInstructions?.phases.map((p) => p.name) || [];
	}, [prepInstructions]);

	const allExpanded = allPhaseNames.length > 0 && allPhaseNames.every((name) =>
		expandedPhases.has(name)
	);

	const toggleAllPhases = () => {
		if (allExpanded) {
			setExpandedPhases(new Set());
		} else {
			setExpandedPhases(new Set(allPhaseNames));
		}
	};

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
		<div className="bg-white rounded-xl overflow-hidden lg:rounded-t-none">
			{/* Header */}
			<div className="p-4 border-b border-cream-dark">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h2 className="text-lg font-semibold text-charcoal">
							Sunday Meal Prep
						</h2>
						<p className="text-sm text-charcoal-muted mt-1">
							<Clock className="w-3.5 h-3.5 inline mr-1" />
							{prepInstructions.totalEstimatedTime} &bull; {completedCount}/{totalTasks} done
						</p>
					</div>
					<div className="flex items-center gap-1">
						<button
							onClick={toggleAllPhases}
							className="p-2 text-charcoal-muted hover:text-charcoal hover:bg-cream-light rounded-lg transition-colors"
							title={allExpanded ? 'Collapse all' : 'Expand all'}
						>
							<ChevronsUpDown className="w-5 h-5" />
						</button>
						<button
							onClick={clearCompleted}
							className="p-2 text-charcoal-muted hover:text-charcoal hover:bg-cream-light rounded-lg transition-colors"
							title="Reset progress"
						>
							<RotateCcw className="w-5 h-5" />
						</button>
						<button
							onClick={copyToClipboard}
							className="p-2 text-charcoal-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
							title="Copy plan"
						>
							<Copy className="w-5 h-5" />
						</button>
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
						storageInstructions={prepInstructions.storageInstructions}
						tips={prepInstructions.tips}
					/>
				))}
			</div>
		</div>
	);
}

// Get icon for phase
function getPhaseIcon(phaseName: string) {
	const iconMap: Record<string, React.ReactNode> = {
		'Prep & Wash': <Droplets className="w-5 h-5 text-blue-500" />,
		'Chop & Dice': <Scissors className="w-5 h-5 text-orange-500" />,
		'Marinate & Season': <FlaskConical className="w-5 h-5 text-purple-500" />,
		'Cook Grains & Bases': <Wheat className="w-5 h-5 text-amber-600" />,
		'Pre-Cook Proteins': <Beef className="w-5 h-5 text-red-500" />,
		'Make Sauces & Dressings': <Flame className="w-5 h-5 text-orange-600" />,
		'Assemble & Store': <Package className="w-5 h-5 text-green-600" />,
	};
	return iconMap[phaseName] || <Clock className="w-5 h-5 text-gray-500" />;
}

interface PhaseSectionProps {
	phase: PrepPhase;
	isExpanded: boolean;
	onToggle: () => void;
	completedTasks: Set<string>;
	onToggleTask: (key: string) => void;
	storageInstructions?: string[];
	tips?: string[];
}

function PhaseSection({
	phase,
	isExpanded,
	onToggle,
	completedTasks,
	onToggleTask,
	storageInstructions = [],
	tips = [],
}: PhaseSectionProps) {
	const completedCount = phase.tasks.filter((task) =>
		completedTasks.has(`${phase.name}-${task.task}`),
	).length;
	const allCompleted =
		completedCount === phase.tasks.length && phase.tasks.length > 0;

	// Check if this is the last phase (Assemble & Store) to show storage tips
	const isStoragePhase = phase.name === 'Assemble & Store';

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
						<ChevronRight className="w-4 h-4" />
					</span>
					{getPhaseIcon(phase.name)}
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
					<CheckCircle className="w-5 h-5 text-green-600" />
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
					{/* Show storage instructions in the Assemble & Store phase */}
					{isStoragePhase && storageInstructions.length > 0 && (
						<div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
							<div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
								<Info className="w-4 h-4" />
								Storage Tips
							</div>
							<ul className="text-sm text-blue-700 space-y-1">
								{storageInstructions.map((instruction, i) => (
									<li key={i} className="flex items-start gap-2">
										<span className="text-blue-400 mt-0.5">•</span>
										{instruction}
									</li>
								))}
							</ul>
						</div>
					)}
					{/* Show pro tips at the end of first phase */}
					{phase.name === 'Prep & Wash' && tips.length > 0 && (
						<div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
							<div className="flex items-center gap-2 text-sm font-medium text-amber-800 mb-2">
								<Lightbulb className="w-4 h-4" />
								Pro Tips
							</div>
							<ul className="text-sm text-amber-700 space-y-1">
								{tips.map((tip, i) => (
									<li key={i} className="flex items-start gap-2">
										<span className="text-amber-400 mt-0.5">•</span>
										{tip}
									</li>
								))}
							</ul>
						</div>
					)}
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
					{isCompleted && <Check className="w-3 h-3" />}
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

