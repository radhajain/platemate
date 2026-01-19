import { Prompt } from './prompts/prompt';

// Calls the server-side API route to use Claude
export async function llm(prompt: Prompt): Promise<string | undefined> {
	const systemPrompt = `${prompt.systemPrompt}\n\n${prompt.returnType}`;
	const userMessage = prompt.taskPrompt;

	console.log('Sending to Claude via API:', { systemPrompt, userMessage });

	try {
		const res = await fetch('/api/llm', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ systemPrompt, userMessage }),
		});

		if (!res.ok) {
			throw new Error(`API error: ${res.status}`);
		}

		const data = await res.json();
		console.log('Claude response:', data.response);
		return data.response;
	} catch (error) {
		console.error('Failed to generate text with Claude:', error);
		return undefined;
	}
}

// JSON-specific variant for structured responses
export async function llmJSON<T>(prompt: Prompt): Promise<T | undefined> {
	const response = await llm(prompt);
	if (!response) return undefined;

	try {
		// Extract JSON from response (handle markdown code blocks)
		const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
		const jsonStr = jsonMatch ? jsonMatch[1].trim() : response.trim();
		return JSON.parse(jsonStr) as T;
	} catch (error) {
		console.error('Failed to parse JSON response:', error);
		return undefined;
	}
}
