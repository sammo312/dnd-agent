import { tool } from 'ai';
import { z } from 'zod';

export const narrativeQueryTool = tool({
  description: 'Query the story/narrative structure. Get current scene info, available story paths, NPC dialogue. Use to maintain narrative consistency.',
  parameters: z.object({
    action: z.enum(['current_scene', 'list_connections', 'get_dialogue', 'get_story_node']),
    nodeId: z.string().optional().describe('ID of a specific story node'),
    npcName: z.string().optional().describe('Name of an NPC to get dialogue for'),
  }),
  execute: async ({ action, nodeId, npcName }) => {
    switch (action) {
      case 'current_scene':
        return { scene: 'The party stands at a crossroads', mood: 'tense' };
      case 'list_connections':
        return { paths: ['Continue north to the mountain pass', 'Turn east toward the village', 'Investigate the ruins to the west'] };
      case 'get_dialogue':
        return { npc: npcName || 'Unknown', dialogue: 'I wouldn\'t go that way if I were you...' };
      case 'get_story_node':
        return { node: nodeId || 'start', summary: 'The adventure begins...' };
      default:
        return { error: 'Unknown action' };
    }
  },
});
