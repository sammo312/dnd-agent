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
import { TERRAIN_TEMPLATES_PROMPT } from "../terrain-templates";

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
MAP — name the terrain template that best fits (Island, Volcano, Forest, Coastline, Mountain Pass, River Valley, Desert Ruins, Frozen Tundra, or "custom" if none fit), then give the executor a tight layer-by-layer paint plan adapted to your dimensions. Format each layer as one short sentence with rough tile bounds, e.g. "L1 base: deep-water full container", "L2 landmass: grass overlapping rectangles centered on (24,18)", "L3 hill: rock cluster (20,15)→(28,20)". 4-6 layers, each translating to one paintTerrain call. Lean on the templates section below for the recipe — adapt freely, don't reproduce them verbatim.

Pick non-square dimensions to match the chosen template's silhouette. Stay between 25 and 60 on each axis.
NARRATIVE POIS — bulleted list, max 4 for a first-pass plan. These are the landmarks with story weight: tavern, ruin, mansion, well, watchtower, mine, bridge, named statue, etc. For each: name, POI type from the catalog, approximate tile coords, and ONE sentence describing what the player sees when they walk up. Every narrative POI must have a beat — include a tiny 1-2 sentence dialogue snippet the executor can use as the beat content.

SCENERY DRESSING — separate bulleted list, 4-8 entries describing CLUSTERS of decorative POIs (no beats, pure visual texture). Use only these types: tree-single, flower-bed, fence-wood, fence-stone, fence-iron, torch, banner. For each cluster, describe the shape and location, e.g.:
  - "Pine grove of 5-6 trees clustered around (12,8) breaking up the hillside"
  - "Flower beds (3) lining the village square near the well"
  - "Wood fence segments (4) along the road from the mill to the bridge"
  - "Torches (2) flanking the ruin entrance for atmosphere"
  - "Banners (2) on the castle approach"
The executor will translate each cluster into 3-7 individual addPOI calls. Plan scenery deliberately — bare maps feel dead, but cluttered maps feel busy. Treat scenery like punctuation: trees thicken forest edges, fences mark property lines, torches mark importance, flowers mark cultivation.
SPAWN — single tile coord plus a one-line rationale ("edge of forest path facing the village so the first thing the player sees is the rooftops").
PREFACE — 2-4 sentence opening framing the executor will turn into the preface dialogue node. Write it in-fiction, second person — this is what the player reads. Use the editor's color tags inline if a noun deserves one (red for threats, yellow for items, cyan for landmarks, green for magic, magenta for visions). Most prefaces have zero or one colored token — don't decorate.
BEATS — for each NARRATIVE POI (not scenery), a short approach beat (1-2 short sentences of in-fiction prose, same color rules as preface). The executor will create the beat section + node and place the trigger on the POI's tile. Scenery POIs do NOT need beats.

## Constraints
- Prefer a TIGHT, COHERENT first pass over a maximalist one. The executor has a tool budget per turn — overdesigning means rate-limit failures, not richness.
- All in-fiction prose (preface, beat snippets) is for the player's eyes. Plain narration by default; reserve excited/thoughtful/hesitant pace for character dialogue, not narration.
- Do not output JSON. Do not output tool call syntax. Do not number the sections. Just the design brief.
- Do not preamble. Do not say "Here's the plan:". Start with "THEME — ..." on the first line.

${TERRAIN_TEMPLATES_PROMPT}`;

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
