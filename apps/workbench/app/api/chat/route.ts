import { streamText, convertToCoreMessages } from "ai";
import type { Message } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { dmTools } from "@dnd-agent/dm-terminal/lib/ai/tools";
import {
  buildSystemPrompt,
  type WorkspaceSnapshot,
} from "@dnd-agent/dm-terminal/lib/ai/system-prompt";

export const maxDuration = 60;

// Route Anthropic calls through the Vercel AI Gateway. We pin
// `@ai-sdk/anthropic@^1` because this app uses `ai@^4`, which only
// accepts v1-spec language model objects. The bare-string pattern
// (`model: "anthropic/claude-..."`) was tried earlier and throws
// `AI_UnsupportedModelVersionError` — that resolver returns a v2-spec
// gateway model and is an AI SDK 5+ feature.
//
// Auth: the Gateway needs a token. In Vercel preview/prod we use the
// `AI_GATEWAY_API_KEY` env var; without it the SDK falls back to
// looking for `ANTHROPIC_API_KEY` and surfaces "Anthropic API key is
// missing". Set `AI_GATEWAY_API_KEY` in the Vercel project env to fix.
const anthropic = createAnthropic({
  baseURL: "https://ai-gateway.vercel.sh/v1",
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export async function POST(req: Request) {
  const {
    messages,
    workspace,
  }: { messages: Message[]; workspace?: WorkspaceSnapshot } = await req.json();

  const result = streamText({
    // Haiku 3.5 has a substantially higher TPM ceiling than Haiku 4.5
    // on the AI Gateway's default tier — easily 3-4x — and is still
    // strong at tool orchestration / scene-prep work, which is most of
    // what the DM agent does. Bumped down here after hitting 429s on
    // 4.5 with realistic workspace sizes. If TPM stops being the
    // bottleneck (paid tier, smaller prompts), reconsider 4.5.
    model: anthropic("claude-3-5-haiku-20241022"),
    system: buildSystemPrompt(workspace),
    messages: convertToCoreMessages(messages),
    tools: dmTools,
    // Prevent runaway tool chains that blow the per-minute token budget.
    maxSteps: 6,
    // Don't compound rate-limit errors with auto-retries.
    maxRetries: 1,
    onError({ error }) {
      console.log("[v0] streamText error:", error);
    },
  });

  return result.toDataStreamResponse({
    getErrorMessage: (error: unknown) => {
      console.log("[v0] toDataStreamResponse error:", error);
      if (error instanceof Error) return error.message;
      if (typeof error === "string") return error;
      try {
        return JSON.stringify(error);
      } catch {
        return "Unknown error";
      }
    },
  });
}
