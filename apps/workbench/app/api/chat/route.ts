import { streamText, convertToCoreMessages } from 'ai';
import type { Message } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { dmTools } from '@dnd-agent/dm-terminal/lib/ai/tools';
import { buildSystemPrompt } from '@dnd-agent/dm-terminal/lib/ai/system-prompt';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: buildSystemPrompt(),
    messages: convertToCoreMessages(messages),
    tools: dmTools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
