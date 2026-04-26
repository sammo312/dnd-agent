import { streamText, convertToCoreMessages } from "ai";
import type { Message } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { dmTools } from "@dnd-agent/dm-terminal/lib/ai/tools";
import {
  buildSystemPrompt,
  type WorkspaceSnapshot,
} from "@dnd-agent/dm-terminal/lib/ai/system-prompt";

export const maxDuration = 60;

// Route Anthropic calls through the Vercel AI Gateway.
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
    model: anthropic("anthropic/claude-sonnet-4"),
    system: buildSystemPrompt(workspace),
    messages: convertToCoreMessages(messages),
    tools: dmTools,
    maxSteps: 16,
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
