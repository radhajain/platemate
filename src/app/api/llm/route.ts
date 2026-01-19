import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
	const { systemPrompt, userMessage } = await request.json();

	try {
		const message = await anthropic.messages.create({
			model: 'claude-haiku-4-5-20251001',
			max_tokens: 10024,
			system: systemPrompt,
			messages: [{ role: 'user', content: userMessage }],
		});

		const textContent = message.content.find((block) => block.type === 'text');
		const response =
			textContent?.type === 'text' ? textContent.text : undefined;

		return NextResponse.json({ response });
	} catch (error) {
		console.error('LLM error:', error);
		return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
	}
}
