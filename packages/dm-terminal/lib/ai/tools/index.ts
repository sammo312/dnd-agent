import { diceTool } from "./dice";
import {
  dmPrepTools,
  setSceneContextTool,
  addCharacterTool,
  createChapterTool,
  addDialogueNodeTool,
  setMapDimensionsTool,
  paintTerrainTool,
  addPOITool,
  askQuestionTool,
  linkToSurfaceTool,
  type DmPrepToolName,
} from "./prep-tools";

/**
 * Tools used by the DM PREP ASSISTANT (workbench/api/chat).
 *
 * - `rollDice` runs server-side (pure function, useful in chat too).
 * - All `dmPrepTools` are CLIENT-SIDE: the model emits the call, the
 *   AI SDK pauses the loop, and the terminal-shell's `onToolCall`
 *   applies the mutation to the relevant zustand store
 *   (story-store, map-store, dm-context-store) and returns a result.
 */
export const dmTools = {
  rollDice: diceTool,
  ...dmPrepTools,
};

// Re-export tool names that need client-side handling.
export const PREP_TOOL_NAMES: DmPrepToolName[] = [
  "setSceneContext",
  "addCharacter",
  "createChapter",
  "addDialogueNode",
  "setMapDimensions",
  "paintTerrain",
  "addPOI",
  "askQuestion",
  "linkToSurface",
];

export {
  setSceneContextTool,
  addCharacterTool,
  createChapterTool,
  addDialogueNodeTool,
  setMapDimensionsTool,
  paintTerrainTool,
  addPOITool,
  askQuestionTool,
  linkToSurfaceTool,
  diceTool,
};

export type { DmPrepToolName };
