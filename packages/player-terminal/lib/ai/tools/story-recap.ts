import { tool } from 'ai';
import { z } from 'zod';

export const storyRecapTool = tool({
  description:
    'Query story and narrative context. Use to help the player understand what has happened, who they have met, and what they should be doing.',
  parameters: z.object({
    action: z.enum(['get_recap', 'explain_beat', 'list_npcs', 'get_current_quest']),
    value: z
      .string()
      .optional()
      .describe('For explain_beat: the name or ID of the story beat to explain.'),
  }),
  execute: async ({ action, value }) => {
    // Stub implementation — to be connected to actual game state later
    switch (action) {
      case 'get_recap':
        return {
          recap:
            'The adventure has just begun. You find yourself at the start of a new journey. Ask your DM for details about what has happened so far.',
          note: 'Story recap will be populated as the adventure progresses.',
        };

      case 'explain_beat':
        return {
          beat: value || 'unknown',
          explanation:
            'This story beat has not been fully recorded yet. Ask your DM to fill you in on the details.',
          note: 'Story beats will be tracked as the narrative unfolds.',
        };

      case 'list_npcs':
        return {
          npcs: [],
          note: 'NPCs will be tracked as you encounter them during the adventure.',
        };

      case 'get_current_quest':
        return {
          quest: 'No active quest recorded yet.',
          objectives: [],
          note: 'Quest objectives will be tracked as your DM assigns them.',
        };

      default:
        return { error: 'Unknown action' };
    }
  },
});
