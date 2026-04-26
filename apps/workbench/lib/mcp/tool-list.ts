/**
 * Tool definitions advertised over MCP.
 *
 * These mirror the workbench's existing prep tools but are described in
 * MCP's plain JSON-Schema dialect (no zod) so we don't drag a converter
 * into the runtime path. We expose the workspace-mutation tools — the
 * ones that visibly fill in the map editor and story boarder when an
 * external client like Claude Desktop drives them. UI-flow tools
 * (`askQuestion`, `linkToSurface`) are intentionally excluded because
 * they only make sense inside the in-app DM terminal.
 */

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const terrainEnum = [
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
];

const poiTypeEnum = [
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
];

export const MCP_TOOLS: McpTool[] = [
  {
    name: "setSceneContext",
    description:
      "Save the high-level pitch for the scene. Replaces any existing scene context.",
    inputSchema: {
      type: "object",
      required: ["title", "pitch", "summary"],
      properties: {
        title: { type: "string", description: "Short scene title." },
        pitch: { type: "string", description: "One-sentence hook." },
        summary: {
          type: "string",
          description: "2-4 sentence situation summary.",
        },
        tone: { type: "string" },
        setting: { type: "string" },
      },
    },
  },
  {
    name: "addCharacter",
    description: "Record a player character, NPC, or antagonist.",
    inputSchema: {
      type: "object",
      required: ["name", "role", "description"],
      properties: {
        name: { type: "string" },
        role: { type: "string", enum: ["pc", "npc", "antagonist"] },
        description: { type: "string" },
        motivation: { type: "string" },
      },
    },
  },
  {
    name: "createChapter",
    description:
      "Create a section in the Story Boarder. 'preface' runs once on load (max one per project); 'beat' is triggered on the map.",
    inputSchema: {
      type: "object",
      required: ["name", "title", "kind"],
      properties: {
        name: {
          type: "string",
          description: "snake_case canonical id, e.g. 'tavern_intro'.",
        },
        title: { type: "string" },
        kind: { type: "string", enum: ["preface", "beat"] },
      },
    },
  },
  {
    name: "addDialogueNode",
    description:
      "Add a dialogue node to a chapter. Use `lines` for narration; reach for `segments` only when pacing or color genuinely matter (typically character speech). Segments concatenate raw with NO automatic spacing — include trailing spaces yourself.",
    inputSchema: {
      type: "object",
      required: ["chapterName", "nodeId", "speaker"],
      properties: {
        chapterName: { type: "string" },
        nodeId: { type: "string" },
        speaker: { type: "string" },
        lines: {
          type: "array",
          items: { type: "string" },
          description: "Preferred for narration. Each entry is one neutral segment.",
        },
        segments: {
          type: "array",
          items: {
            type: "object",
            required: ["text"],
            properties: {
              text: { type: "string" },
              pace: {
                type: "string",
                enum: [
                  "excited",
                  "neutral",
                  "thoughtful",
                  "hesitant",
                  "pause",
                ],
              },
              color: {
                type: "string",
                enum: [
                  "red",
                  "green",
                  "blue",
                  "yellow",
                  "magenta",
                  "cyan",
                  "white",
                ],
              },
            },
          },
        },
        choices: {
          type: "array",
          items: {
            type: "object",
            required: ["label", "targetNodeId"],
            properties: {
              label: { type: "string" },
              targetNodeId: { type: "string" },
            },
          },
        },
        isStart: { type: "boolean" },
      },
    },
  },
  {
    name: "setMapDimensions",
    description:
      "Resize the map. Default is 20x15. ~10x8 for an interior, 15-20 for a town, 25-40 for a region.",
    inputSchema: {
      type: "object",
      required: ["width", "height"],
      properties: {
        width: { type: "integer", minimum: 5, maximum: 60 },
        height: { type: "integer", minimum: 5, maximum: 60 },
        reset: { type: "boolean" },
      },
    },
  },
  {
    name: "paintTerrain",
    description:
      "Paint a rectangular region of the map with a terrain type. Coordinates inclusive.",
    inputSchema: {
      type: "object",
      required: ["terrain", "x1", "y1", "x2", "y2"],
      properties: {
        terrain: { type: "string", enum: terrainEnum },
        x1: { type: "integer" },
        y1: { type: "integer" },
        x2: { type: "integer" },
        y2: { type: "integer" },
      },
    },
  },
  {
    name: "addPOI",
    description:
      "Place a point of interest on the map. EVERY POI must be paired with a beat (createChapter kind:'beat' + addDialogueNode + placeBeat at the same coordinates) so walking up to it shows the player a description.",
    inputSchema: {
      type: "object",
      required: ["poiType", "name", "x", "y"],
      properties: {
        poiType: { type: "string", enum: poiTypeEnum },
        name: { type: "string" },
        x: { type: "integer" },
        y: { type: "integer" },
      },
    },
  },
  {
    name: "setSpawn",
    description:
      "Set the tile the player loads into. Required before export.",
    inputSchema: {
      type: "object",
      required: ["x", "y"],
      properties: {
        x: { type: "integer" },
        y: { type: "integer" },
      },
    },
  },
  {
    name: "placeBeat",
    description:
      "Wire a 'beat' section onto the map at a tile. When the player walks within `radius` tiles, the linked section runs. The section MUST already exist via createChapter with kind:'beat'.",
    inputSchema: {
      type: "object",
      required: ["sectionName", "name", "x", "y"],
      properties: {
        sectionName: { type: "string" },
        name: { type: "string" },
        x: { type: "integer" },
        y: { type: "integer" },
        radius: { type: "integer", minimum: 0, maximum: 5 },
        nodeId: { type: "string" },
        oneShot: { type: "boolean" },
      },
    },
  },
];
