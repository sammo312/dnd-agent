import { streamText, convertToCoreMessages } from 'ai';
import type { Message } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { playerTools } from '@dnd-agent/player-terminal/lib/ai/tools';
import { buildPlayerSystemPrompt } from '@dnd-agent/player-terminal/lib/ai/system-prompt';

export const maxDuration = 60;

// Same setup as apps/workbench/app/api/chat/route.ts — see that file for
// the full rationale. Short version: this app pins `ai@^4`, which only
// accepts v1-spec model objects, so we go through `@ai-sdk/anthropic@^1`
// and point its baseURL at the Vercel AI Gateway. Auth uses
// `AI_GATEWAY_API_KEY` (set in the Vercel project env).
const anthropic = createAnthropic({
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4'),
    system: buildPlayerSystemPrompt(),
    messages: convertToCoreMessages(messages),
    tools: playerTools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
