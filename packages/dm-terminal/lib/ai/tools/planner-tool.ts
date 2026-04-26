/**
 * The "senior planner" — a server-side tool that lets the fast executor
 * model (Haiku) escalate to a more capable reasoner (Sonnet) for
 * creatively-loaded multi-step requests. Pattern is "planner-as-tool":
 *
 *   user message
 *     -> Haiku (executor, all dmTools, fast)
 *        -> calls planNarrative for hard creative work
 *           -> Sonnet (planner, no tools, deep reasoning)
 *           -> returns a concrete plan
 *        -> Haiku translates plan into mechanical tool calls
 *
 * Why this shape vs an explicit two-stage pipeline:
 *   - One client-visible chat stream. UX stays simple.
 *   - The executor decides when to escalate, so simple turns
 *     ("rename Bob to Bobby") never pay the planner round-trip cost.
 *   - Each model plays to its strength: Sonnet thinks, Haiku acts. The
 *     bulk of the per-turn token spend stays on Haiku, which has the
 *     higher TPM ceiling on the gateway.
 *
 * The plan is returned as plain prose (a structured-but-readable spec),
 * not as nested JSON. Haiku is much better at following a written
 * design brief than mapping a foreign JSON schema back to its own tool
 * surface, and prose lets the executor adapt rather than blindly
 * dispatch — useful when the workspace state evolves mid-turn.
 */
import { tool, generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

// Same gateway setup as the chat route. The planner call lives inside
// the same lambda, so it shares the AI_GATEWAY_API_KEY env var that's
// already configured in Vercel for production.
const anthropic = createAnthropic({
  baseURL: "https://ai-gateway.vercel.sh/v1",
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

const PLANNER_SYSTEM_PROMPT = `You are the SENIOR PLANNER for a tabletop scene-prep workbench. A faster executor model will read your plan and translate it into concrete editor mutations (creating chapters, painting terrain, placing POIs and beats, writing dialogue nodes). Your job is to produce a focused, opinionated, executable design brief.

You never speak to the end user. You speak to the executor model. Be terse, specific, and decisive.

## What you produce
A single design brief in plain prose, structured like this — keep section headers exactly as shown so the executor can scan them:

THEME — one sentence on tone, genre, vibe.
CHARACTERS — bulleted list, max 4. For each: name, role, one-sentence personality hook the executor can use when writing dialogue.
MAP — width × height (pick something between 30×30 and 60×60 unless the request demands otherwise). Then a few sentences on the broad zones (e.g. "north half is dense forest, south half is a cleared plain with the village in the middle"). Don't enumerate every tile.
POIS — bulleted list, max 4 for a first-pass plan. For each: name, POI type from the catalog (tavern, ruin, statue, well, signpost, tree, rock, etc.), approximate tile coords, and ONE sentence describing what the player sees when they walk up. Every POI must have a beat — call this out by including a tiny 1-2 sentence dialogue snippet the executor can use as the beat content.
SPAWN — single tile coord plus a one-line rationale ("edge of forest path facing the village so the first thing the player sees is the rooftops").
PREFACE — 2-4 sentence opening framing the executor will turn into the preface dialogue node. Write it in-fiction, second person — this is what the player reads. Use the editor's color tags inline if a noun deserves one (red for threats, yellow for items, cyan for landmarks, green for magic, magenta for visions). Most prefaces have zero or one colored token — don't decorate.
BEATS — for each POI, a short approach beat (1-2 short sentences of in-fiction prose, same color rules as preface). The executor will create the beat section + node and place the trigger on the POI's tile.

## Constraints
- Prefer a TIGHT, COHERENT first pass over a maximalist one. The executor has a tool budget per turn — overdesigning means rate-limit failures, not richness.
- All in-fiction prose (preface, beat snippets) is for the player's eyes. Plain narration by default; reserve excited/thoughtful/hesitant pace for character dialogue, not narration.
- Do not output JSON. Do not output tool call syntax. Do not number the sections. Just the design brief.
- Do not preamble. Do not say "Here's the plan:". Start with "THEME — ..." on the first line.`;

export const plannerTool = tool({
  description:
    "Consult the senior planner for creatively-loaded or multi-step requests (build a haunted village, design a heist, sketch a coherent first-pass scene from a one-line pitch). The planner is a more capable model and will return a focused design brief covering theme, characters, map zones, POIs with beats, spawn, and preface. Call this BEFORE running any building tools when the request is open-ended or design-heavy. Do NOT call this for simple edits (rename, move spawn, add one POI to an existing scene) — handle those directly.",
  parameters: z.object({
    request: z
      .string()
      .describe(
        "The DM's request, paraphrased into a clear creative ask. Include any constraints they specified (tone, scope, genre).",
      ),
    workspaceSummary: z
      .string()
      .optional()
      .describe(
        "Short summary of what already exists in the workspace, if anything. Pass this when iterating on an in-progress scene so the planner doesn't re-design things.",
      ),
  }),
  execute: async ({ request, workspaceSummary }) => {
    try {
      const userPrompt = workspaceSummary
        ? `DM request:\n${request}\n\nCurrent workspace state:\n${workspaceSummary}\n\nProduce the design brief for this request, taking the existing state into account.`
        : `DM request:\n${request}\n\nThe workspace is empty. Produce the first-pass design brief.`;

      const { text } = await generateText({
        // Sonnet 4.5 is the senior reasoner. Native Anthropic dated slug
        // is `claude-sonnet-4-5-20250929` if the unversioned alias ever
        // stops resolving on the gateway.
        model: anthropic("claude-sonnet-4-5"),
        system: PLANNER_SYSTEM_PROMPT,
        prompt: userPrompt,
        maxRetries: 2,
      });

      return { plan: text };
    } catch (error) {
      // Surface the failure to the executor in a structured shape so it
      // can decide whether to retry, fall back to its own planning, or
      // ask the DM for clarification. Don't throw — that would abort
      // the executor's tool loop and lose the user's turn.
      return {
        plan: null,
        error:
          error instanceof Error ? error.message : "Planner unavailable.",
      };
    }
  },
});
