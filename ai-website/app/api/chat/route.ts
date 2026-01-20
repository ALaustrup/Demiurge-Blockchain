import { Anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { DEMIURGE_SYSTEM_PROMPT } from '@/lib/prompt';

export const runtime = 'edge';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20240620'),
    system: DEMIURGE_SYSTEM_PROMPT,
    messages,
  });

  return result.toAIStreamResponse();
}
