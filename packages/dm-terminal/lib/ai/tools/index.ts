import { diceTool } from './dice';
import { mapQueryTool } from './map-query';
import { narrativeQueryTool } from './narrative-query';
import { nameGeneratorTool } from './name-generator';
import { sceneManagerTool } from './scene-manager';
import { worldTools } from './world-tools';

export const dmTools = {
  rollDice: diceTool,
  queryMap: mapQueryTool,
  queryNarrative: narrativeQueryTool,
  generateName: nameGeneratorTool,
  manageScene: sceneManagerTool,
};

// Combined tools: game logic + world mutations
export const allDmTools = {
  ...dmTools,
  ...worldTools,
};

export { worldTools };
