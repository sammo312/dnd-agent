import { diceTool } from './dice';
import { mapQueryTool } from './map-query';
import { narrativeQueryTool } from './narrative-query';
import { nameGeneratorTool } from './name-generator';
import { sceneManagerTool } from './scene-manager';

export const dmTools = {
  rollDice: diceTool,
  queryMap: mapQueryTool,
  queryNarrative: narrativeQueryTool,
  generateName: nameGeneratorTool,
  manageScene: sceneManagerTool,
};
