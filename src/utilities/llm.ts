'use server';

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

// Type for JSON Schema
export type JsonSchema = {
	type: 'object';
	properties: Record<string, unknown>;
	required: string[];
	additionalProperties: false;
};

// Structured output function using Claude's native JSON schema support
export async function llmStructured<T>(
	systemPrompt: string,
	userMessage: string,
	schema: JsonSchema,
): Promise<T | undefined> {
	try {
		const response = await anthropic.beta.messages.create({
			model: 'claude-haiku-4-5-20251001',
			max_tokens: 10024,
			betas: ['structured-outputs-2025-11-13'],
			system: systemPrompt,
			messages: [{ role: 'user', content: userMessage }],
			output_format: {
				type: 'json_schema',
				schema: schema,
			},
		});

		const textContent = response.content.find((block) => block.type === 'text');
		if (textContent?.type === 'text') {
			return JSON.parse(textContent.text) as T;
		}
		return undefined;
	} catch (error) {
		console.error('Failed to generate structured output:', error);
		// Log full error details for debugging
		if (error instanceof Error) {
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);
		}
		return undefined;
	}
}
