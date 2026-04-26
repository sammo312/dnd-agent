import { streamText, convertToCoreMessages } from 'ai';
import type { Message } from 'ai';
import { playerTools } from '@dnd-agent/player-terminal/lib/ai/tools';
import { buildPlayerSystemPrompt } from '@dnd-agent/player-terminal/lib/ai/system-prompt';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const result = streamText({
    // Vercel AI Gateway routes by model string — zero-config for Anthropic in v0.
    model: 'anthropic/claude-sonnet-4',
    system: buildPlayerSystemPrompt(),
    messages: convertToCoreMessages(messages),
    tools: playerTools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
