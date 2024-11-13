import { Prompt } from './prompts/prompt';

// Runs on Ollama llama3.2:1b
export async function llm(prompt: Prompt): Promise<string | undefined> {
	console.log('sending ', Prompt.from(prompt));
	const url = 'http://localhost:11434/api/generate';
	const headers = {
		'Content-Type': 'application/json',
	};
	const response = await fetch(url, {
		method: 'POST',
		headers: headers,
		body: JSON.stringify({
			model: 'llama3.2:1b',
			prompt: Prompt.from(prompt),
			stream: false,
		}),
	});
	if (response.status === 200) {
		const text = await response.text();
		const data = JSON.parse(text);
		const llmResponse = data['response'];
		console.log(llmResponse);
		return llmResponse;
	} else {
		console.error(
			'Failed to generate text:',
			response.status,
			response.statusText
		);
	}
}
