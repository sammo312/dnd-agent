import { streamText, convertToCoreMessages } from "ai";
import type { Message } from "ai";
import { dmTools } from "@dnd-agent/dm-terminal/lib/ai/tools";
import {
  buildSystemPrompt,
  type WorkspaceSnapshot,
} from "@dnd-agent/dm-terminal/lib/ai/system-prompt";

export const maxDuration = 60;

export async function POST(req: Request) {
  const {
    messages,
    workspace,
  }: { messages: Message[]; workspace?: WorkspaceSnapshot } = await req.json();

  const result = streamText({
    // Pass the model as a plain string so the AI SDK routes through the
    // Vercel AI Gateway automatically. Anthropic is a zero-config gateway
    // provider — on Vercel deploys, the OIDC token authenticates without
    // an env var. Mirrors apps/player/app/api/player-chat/route.ts.
    //
    // The previous wrapper was reading AI_GATEWAY_API_KEY (unset in
    // prod), causing the SDK to fall back to ANTHROPIC_API_KEY (also
    // unset) and throw "Anthropic API key is missing".
    //
    // Haiku 4.5 has much higher TPM limits than Sonnet on the gateway
    // and is plenty capable for tool-orchestration / scene-prep work.
    // Slug uses a dot (`4.5`), not a hyphen — the dashed variant doesn't
    // resolve on the gateway and fails before the data stream opens, so
    // `getErrorMessage` never runs and the client surfaces a blank
    // "Error:" with no detail.
    model: "anthropic/claude-haiku-4.5",
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
