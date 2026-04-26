import { streamText, convertToCoreMessages } from 'ai';
import type { Message } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { playerTools } from '@dnd-agent/player-terminal/lib/ai/tools';
import { buildPlayerSystemPrompt } from '@dnd-agent/player-terminal/lib/ai/system-prompt';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: buildPlayerSystemPrompt(),
    messages: convertToCoreMessages(messages),
    tools: playerTools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
