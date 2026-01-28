import { JsonSchema } from '../llm';
import { Recipe } from '../../../database.types';
import { Prompt } from './prompt';

export interface PrepTask {
	task: string;
	duration: string;
	forRecipe: string;
	canBeParallelized: boolean;
	notes?: string;
}

export interface PrepPhase {
	name: string;
	tasks: PrepTask[];
	estimatedDuration: string;
}

export interface MealPrepInstructions {
	totalEstimatedTime: string;
	phases: PrepPhase[];
	storageInstructions: string[];
	tips: string[];
}

export const MEAL_PREP_INSTRUCTIONS_SCHEMA: JsonSchema = {
	type: 'object',
	properties: {
		totalEstimatedTime: { type: 'string' },
		phases: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					tasks: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								task: { type: 'string' },
								duration: { type: 'string' },
								forRecipe: { type: 'string' },
								canBeParallelized: { type: 'boolean' },
								notes: { type: 'string' },
							},
							required: [
								'task',
								'duration',
								'forRecipe',
								'canBeParallelized',
							],
							additionalProperties: false,
						},
					},
					estimatedDuration: { type: 'string' },
				},
				required: ['name', 'tasks', 'estimatedDuration'],
				additionalProperties: false,
			},
		},
		storageInstructions: {
			type: 'array',
			items: { type: 'string' },
		},
		tips: {
			type: 'array',
			items: { type: 'string' },
		},
	},
	required: ['totalEstimatedTime', 'phases', 'storageInstructions', 'tips'],
	additionalProperties: false,
};

export function mealPrepInstructionsPrompt(recipes: readonly Recipe[]): Prompt {
	const recipeDetails = recipes
		.map((r) => {
			const ingredients = r.ingredients?.join(', ') || 'No ingredients listed';
			const instructions = r.instructions?.join(' | ') || 'No instructions';
			return `Recipe: ${r.name}
Prep Time: ${r.prepTime || 'Not specified'}
Cook Time: ${r.cookTime || 'Not specified'}
Ingredients: ${ingredients}
Instructions: ${instructions}`;
		})
		.join('\n\n---\n\n');

	return {
		systemPrompt: `You are an expert meal prep coach. Your job is to analyze a week's worth of recipes and create an efficient Sunday meal prep plan.

Your goals:
1. Identify all tasks that can be done ahead of time (chopping, marinating, making sauces/dressings)
2. Group similar tasks together (e.g., all vegetable chopping at once)
3. Identify tasks that can be done in parallel (e.g., while something marinates, chop vegetables)
4. Order tasks efficiently to minimize total time
5. Consider food safety (proteins before vegetables, proper storage)

Phases to organize by (use ONLY these phases):
1. "Chop & Dice" - All cutting tasks grouped by ingredient type
2. "Marinate & Season" - Marinades, spice mixes, dry rubs
3. "Cook Grains & Bases" - Rice, quinoa, pasta, beans
4. "Make Sauces & Dressings" - Sauces, dips, dressings that store well

IMPORTANT: Only include these 4 phases. Do NOT include phases for washing, pre-cooking proteins, assembling, or cooking main dishes - those should be done fresh when cooking each meal.

For parallelization, identify which tasks can happen simultaneously (e.g., while grains cook).
Be realistic about timing - account for setup, cleanup, and transition between tasks.`,

		returnType: `Return your response as valid JSON with this structure:
{
  "totalEstimatedTime": "1 hour 30 minutes",
  "phases": [
    {
      "name": "Chop & Dice",
      "tasks": [
        {
          "task": "Dice onions for multiple recipes",
          "duration": "10 minutes",
          "forRecipe": "Stir Fry, Soup",
          "canBeParallelized": false,
          "notes": "Store in airtight container"
        }
      ],
      "estimatedDuration": "25 minutes"
    }
  ],
  "storageInstructions": [
    "Store chopped vegetables in airtight containers with damp paper towels",
    "Keep marinated proteins in sealed bags, refrigerate up to 3 days"
  ],
  "tips": [
    "While grains cook, you can complete all chopping tasks",
    "Prep all vegetables before moving to marinades"
  ]
}

ONLY use these phase names: "Chop & Dice", "Marinate & Season", "Cook Grains & Bases", "Make Sauces & Dressings"
Skip any phase that has no relevant tasks. Don't include washing, protein cooking, or assembly phases.
The totalEstimatedTime should reflect actual hands-on time when parallelization is used efficiently.`,

		examples: '',

		taskPrompt: `Create a comprehensive Sunday meal prep plan for these ${recipes.length} recipes:

${recipeDetails}

Analyze each recipe and identify:
1. What can be prepped ahead and stored
2. What must be done fresh when cooking
3. Opportunities to batch similar tasks
4. Which tasks can run in parallel

Create an efficient prep plan that minimizes total time while maintaining food quality and safety.`,
	};
}
