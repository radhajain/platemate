export type Prompt = {
	systemPrompt: string;
	returnType: string;
	examples: string;
	taskPrompt: string;
};
export const Prompt = {
	from: ({
		systemPrompt,
		returnType,
		// examples,
		taskPrompt,
	}: Prompt): string => {
		return `${systemPrompt}\n${returnType}\n\n---\n${taskPrompt}\n\nOutput:`;
	},
};
