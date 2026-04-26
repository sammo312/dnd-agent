import { diceTool } from '@dnd-agent/dm-terminal/lib/ai/tools/dice';
import { characterBuilderTool } from './character-builder';
import { storyRecapTool } from './story-recap';
import { rulesLookupTool } from './rules-lookup';

export const playerTools = {
  rollDice: diceTool,
  manageCharacter: characterBuilderTool,
  storyRecap: storyRecapTool,
  lookupRules: rulesLookupTool,
};
