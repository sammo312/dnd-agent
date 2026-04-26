import { tool } from "ai";
import { z } from "zod";

/**
 * DM Prep tools.
 *
 * These tools are CLIENT-SIDE: they have a parameter schema but no
 * server-side `execute`. The Vercel AI SDK pauses the agent loop when
 * the model emits one of these, and the client (terminal-shell) provides
 * the result via `onToolCall`. The client uses `onToolCall` to apply
 * mutations to the Story Boarder, Map Editor, and DM context stores.
 */

export const setSceneContextTool = tool({
  description:
    "Save the high-level pitch for the scene the DM is prepping. Call this AFTER the DM has described the scene to you. Replaces any existing scene context.",
  parameters: z.object({
    title: z.string().describe("Short scene title, e.g. 'The Bone Orchard'"),
    pitch: z
      .string()
      .describe(
        "One-sentence hook. e.g. 'A traveling carnival hides a necromancer harvesting souls from its visitors.'"
      ),
    summary: z
      .string()
      .describe(
        "2-4 sentence summary covering the situation, conflict, and what the players are likely to do."
      ),
    tone: z
      .string()
      .optional()
      .describe("e.g. 'gothic horror', 'heist', 'comedic', 'pulpy adventure'"),
    setting: z
      .string()
      .optional()
      .describe("Where & when the scene takes place"),
  }),
});

export const addCharacterTool = tool({
  description:
    "Record a character — a player character, key NPC, or antagonist. Call once per named character.",
  parameters: z.object({
    name: z.string(),
    role: z.enum(["pc", "npc", "antagonist"]),
    description: z
      .string()
      .describe("1-2 sentences: appearance, role, vibe."),
    motivation: z
      .string()
      .optional()
      .describe("What they want; what drives them in this scene."),
  }),
});

export const createChapterTool = tool({
  description:
    "Create a section (chapter) in the Story Boarder. A section is a string of dialogue beats with branching choices; it ends when a beat has no choices. Two kinds: 'preface' runs once before the player loads into the map (only one per project); 'beat' is triggered on the map by walking near a placed beat. The first section you create should usually be the preface.",
  parameters: z.object({
    name: z
      .string()
      .describe(
        "snake_case section id, e.g. 'tavern_intro'. Used as the canonical key."
      ),
    title: z
      .string()
      .describe("Display title shown in the editor, e.g. 'The Slaughtered Lamb'"),
    kind: z
      .enum(["preface", "beat"])
      .describe(
        "'preface' = runs once on load (max one per project). 'beat' = triggered on the map. Default to 'preface' if no preface exists yet, otherwise 'beat'."
      ),
  }),
});

export const addDialogueNodeTool = tool({
  description:
    "Add a dialogue node to a chapter. Each node is a single beat — a chunk of narration or NPC speech the player will see, plus optional choices that branch to other nodes. Dialogue is broken into typed-out segments; each segment can have its own pace (excited / neutral / thoughtful / hesitant / pause) and optional emphasis color. Vary pace within a node for natural rhythm — drop a 'pause' segment containing '...' for dramatic beats. You can pass either `segments` (richer, preferred) or plain `lines` (each line becomes one neutral segment).",
  parameters: z.object({
    chapterName: z
      .string()
      .describe("Name of the chapter (section) this node belongs to."),
    nodeId: z
      .string()
      .describe(
        "snake_case unique id for this node, e.g. 'barkeep_warning'."
      ),
    speaker: z
      .string()
      .describe("'Narrator' or the NPC's name."),
    segments: z
      .array(
        z.object({
          text: z
            .string()
            .describe(
              "Text content of this segment. Keep IN-FICTION — this is what the player reads."
            ),
          pace: z
            .enum([
              "excited",
              "neutral",
              "thoughtful",
              "hesitant",
              "pause",
            ])
            .optional()
            .describe(
              "Per-character typing pace. Default 'neutral'. 'pause' is great for '...' beats and dramatic moments."
            ),
          color: z
            .enum([
              "red",
              "green",
              "blue",
              "yellow",
              "magenta",
              "cyan",
              "white",
            ])
            .optional()
            .describe(
              "Optional emphasis color for a word or phrase. Use sparingly — usually only for a key noun or threat."
            ),
        })
      )
      .optional()
      .describe(
        "Preferred richer form: 2-8 segments per node. Split a single sentence into multiple segments to vary pace mid-line, e.g. ['I…', 'I think we should run.'] with the first segment as 'hesitant' and the second as 'neutral'."
      ),
    lines: z
      .array(z.string())
      .optional()
      .describe(
        "Simple fallback: each string becomes one neutral segment. Use `segments` instead when pacing matters."
      ),
    choices: z
      .array(
        z.object({
          label: z
            .string()
            .describe("Short button label the player clicks, e.g. 'Threaten him'"),
          targetNodeId: z
            .string()
            .describe(
              "Node id this choice leads to. If the target node doesn't exist yet, a stub will be created and you can fill it in with a later addDialogueNode call."
            ),
        })
      )
      .optional(),
    isStart: z
      .boolean()
      .optional()
      .describe(
        "Mark this as the chapter's starting node. Defaults to true for the first node added to a chapter."
      ),
  }),
});

export const setMapDimensionsTool = tool({
  description:
    "Resize the map. Default is 20x15. Use ~10x8 for an interior/single-room scene, 15-20 for a town or small location, 25-40 for a wider region.",
  parameters: z.object({
    width: z.number().int().min(5).max(60),
    height: z.number().int().min(5).max(60),
    reset: z
      .boolean()
      .optional()
      .describe("If true, clear all cells/POIs/regions before resizing."),
  }),
});

export const paintTerrainTool = tool({
  description:
    "Paint a rectangular region of the map with a terrain type. Coordinates are inclusive. Use to sketch broad zones (water, forest, road, stone floor).",
  parameters: z.object({
    terrain: z
      .enum([
        "grass",
        "forest",
        "water",
        "deep-water",
        "sand",
        "desert",
        "mountain",
        "snow",
        "swamp",
        "marsh",
        "dirt",
        "mud",
        "rock",
        "lava",
        "ice",
        "tundra",
        "stone-floor",
        "cobblestone",
        "wood-planks",
        "brick",
        "marble",
        "tiles",
        "gravel",
        "dirt-road",
        "paved-road",
        "carpet",
        "metal",
        "thatch",
      ])
      .describe("Terrain id"),
    x1: z.number().int(),
    y1: z.number().int(),
    x2: z.number().int(),
    y2: z.number().int(),
  }),
});

export const addPOITool = tool({
  description:
    "Place a point of interest on the map (building, landmark, encounter spot).",
  parameters: z.object({
    poiType: z
      .enum([
        "city",
        "town",
        "village",
        "hamlet",
        "camp",
        "castle",
        "fortress",
        "watchtower",
        "house",
        "mansion",
        "tavern",
        "shop",
        "blacksmith",
        "stable",
        "windmill",
        "warehouse",
        "barn",
        "temple",
        "shrine",
        "graveyard",
        "monument",
        "bridge",
        "well",
        "dock",
        "lighthouse",
        "mine",
        "quarry",
        "tree-single",
        "flower-bed",
        "statue",
        "fountain",
        "torch",
        "banner",
        "cave",
        "ruins",
        "oasis",
        "waterfall",
        "hot-spring",
      ])
      .describe("POI type id"),
    name: z.string().describe("Display name, e.g. 'The Slaughtered Lamb'"),
    x: z.number().int().describe("Grid column (0 = left)"),
    y: z.number().int().describe("Grid row (0 = top)"),
  }),
});

export const setSpawnTool = tool({
  description:
    "Set the tile the player loads into when entering the map. Required before export. Usually placed at the edge of the playable area or on the doorstep of the opening location.",
  parameters: z.object({
    x: z.number().int().describe("Grid column (0 = left)"),
    y: z.number().int().describe("Grid row (0 = top)"),
  }),
});

export const placeBeatTool = tool({
  description:
    "Place a 'beat' section onto the map at a specific tile. When the player walks within `radius` tiles of (x,y), the linked section runs. Use this to wire exploration sections to map locations. The section MUST already exist via createChapter with kind:'beat'.",
  parameters: z.object({
    sectionName: z
      .string()
      .describe("Name of the section to trigger (must exist, kind:'beat')."),
    name: z
      .string()
      .describe(
        "Short label shown for the marker, e.g. 'tavern doorstep'. Doesn't have to match the section title."
      ),
    x: z.number().int().describe("Grid column (0 = left)"),
    y: z.number().int().describe("Grid row (0 = top)"),
    radius: z
      .number()
      .int()
      .min(0)
      .max(5)
      .optional()
      .describe(
        "Trigger radius in tiles. 0 = exact tile, 1 = adjacent (default), 2+ = wider zone."
      ),
    nodeId: z
      .string()
      .optional()
      .describe(
        "Optional. If set, the beat starts at this specific dialogue node instead of the section's start node."
      ),
    oneShot: z
      .boolean()
      .optional()
      .describe("If true (default), the beat fires only once."),
  }),
});

/**
 * Ask the DM a multi-choice question. The terminal opens an in-line
 * picker (arrow-keys / 1-9 / enter / esc) and the agent receives the
 * selected option (or `{ skipped: true }` if the DM hits esc).
 *
 * Use this whenever there's a meaningful fork — tone, scope, which
 * NPC to flesh out next — and the answer changes what you'll do.
 * Don't use it for free-form ideas; ask in plain text instead.
 */
export const askQuestionTool = tool({
  description:
    "Ask the DM a multi-choice question. The terminal renders an inline picker; the DM selects with arrow keys or 1-9. Use for forks where the choice steers what you build next. Skip it for free-form questions — just ask in prose.",
  parameters: z.object({
    question: z
      .string()
      .describe("The question. Short. e.g. 'Tone for this scene?'"),
    description: z
      .string()
      .optional()
      .describe(
        "Optional one-line clarification shown under the question."
      ),
    choices: z
      .array(
        z.object({
          value: z
            .string()
            .describe(
              "Stable identifier returned to you. e.g. 'gothic_horror'. snake_case."
            ),
          label: z.string().describe("Display label, e.g. 'Gothic horror'"),
          hint: z
            .string()
            .optional()
            .describe(
              "Optional dim subtitle, e.g. 'broody, candle-lit, cursed'"
            ),
        })
      )
      .min(2)
      .max(6),
  }),
});

/**
 * Render a "link to surface" card in the terminal pointing at the
 * Map Editor or Story Boarder. Use this AFTER finishing a meaningful
 * batch of edits to give the DM a CTA card with a slash-command shortcut.
 */
export const linkToSurfaceTool = tool({
  description:
    "Drop a card in the terminal linking the DM to the Map Editor or Story Boarder. Use AFTER you've finished a batch of edits to one surface — gives the DM a CTA + slash-command shortcut. One card per surface per turn, max.",
  parameters: z.object({
    surface: z
      .enum(["map", "story"])
      .describe("Which surface the DM should review."),
    title: z
      .string()
      .describe(
        "2-4 word change header, e.g. 'map updated', 'opening beat ready'."
      ),
    summary: z
      .string()
      .describe("1-2 sentence summary of what changed and why it's worth a look."),
  }),
});

export const dmPrepTools = {
  setSceneContext: setSceneContextTool,
  addCharacter: addCharacterTool,
  createChapter: createChapterTool,
  addDialogueNode: addDialogueNodeTool,
  setMapDimensions: setMapDimensionsTool,
  paintTerrain: paintTerrainTool,
  addPOI: addPOITool,
  setSpawn: setSpawnTool,
  placeBeat: placeBeatTool,
  askQuestion: askQuestionTool,
  linkToSurface: linkToSurfaceTool,
};

export type DmPrepToolName = keyof typeof dmPrepTools;
