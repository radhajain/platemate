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
1. Identify all tasks that can be done ahead of time (washing, chopping, marinating, pre-cooking grains/proteins, making sauces)
2. Group similar tasks together (e.g., all vegetable chopping at once)
3. Identify tasks that can be done in parallel (e.g., while rice cooks, chop vegetables)
4. Order tasks efficiently to minimize total time
5. Consider food safety (proteins before vegetables, proper storage)

Phases to organize by:
1. "Prep & Wash" - Washing produce, measuring dry ingredients
2. "Chop & Dice" - All cutting tasks grouped by ingredient type
3. "Marinate & Season" - Marinades, spice mixes, dressings
4. "Cook Grains & Bases" - Rice, quinoa, pasta, beans
5. "Pre-Cook Proteins" - Any proteins that benefit from advance cooking
6. "Make Sauces & Dressings" - Sauces, dips, dressings that store well
7. "Assemble & Store" - Portioning and storage

For parallelization, identify which tasks can happen simultaneously (e.g., while something simmers).
Be realistic about timing - account for setup, cleanup, and transition between tasks.`,

		returnType: `Return your response as valid JSON with this structure:
{
  "totalEstimatedTime": "2 hours 15 minutes",
  "phases": [
    {
      "name": "Prep & Wash",
      "tasks": [
        {
          "task": "Wash and dry all leafy greens",
          "duration": "10 minutes",
          "forRecipe": "Kale Salad, Herb Salad",
          "canBeParallelized": false,
          "notes": "Use a salad spinner for best results"
        }
      ],
      "estimatedDuration": "15 minutes"
    }
  ],
  "storageInstructions": [
    "Store chopped vegetables in airtight containers with damp paper towels",
    "Keep marinated proteins in sealed bags, refrigerate up to 3 days"
  ],
  "tips": [
    "Start with tasks that need the most passive time (marinating, soaking)",
    "While grains cook, you can complete all chopping tasks"
  ]
}

Be specific about what can be prepped ahead. Don't include tasks that should be done fresh (like assembling salads or final cooking).
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
