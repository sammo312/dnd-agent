import { tool } from 'ai';
import { z } from 'zod';
import type { GameSessionState } from '@dnd-agent/shared';

let gameState: GameSessionState = {
  sessionId: crypto.randomUUID(),
  currentLocationId: 'start',
  currentSceneId: 'intro',
  timeOfDay: 'morning',
  activeConditions: [],
  playerInventory: [],
  visitedLocations: ['start'],
  npcRelationships: {},
};

export const sceneManagerTool = tool({
  description: 'Track and update the game session state: current location, time of day, conditions, visited locations. Use to maintain continuity.',
  parameters: z.object({
    action: z.enum(['get_state', 'move_to', 'set_time', 'add_condition', 'remove_condition', 'visit_location']),
    value: z.string().optional().describe('The value for the action (location id, time of day, condition name)'),
  }),
  execute: async ({ action, value }) => {
    switch (action) {
      case 'get_state':
        return { ...gameState };
      case 'move_to':
        if (value) {
          gameState.currentLocationId = value;
          if (!gameState.visitedLocations.includes(value)) {
            gameState.visitedLocations.push(value);
          }
        }
        return { moved: true, location: gameState.currentLocationId };
      case 'set_time':
        if (value && ['dawn', 'morning', 'afternoon', 'dusk', 'night'].includes(value)) {
          gameState.timeOfDay = value as GameSessionState['timeOfDay'];
        }
        return { time: gameState.timeOfDay };
      case 'add_condition':
        if (value && !gameState.activeConditions.includes(value)) {
          gameState.activeConditions.push(value);
        }
        return { conditions: gameState.activeConditions };
      case 'remove_condition':
        gameState.activeConditions = gameState.activeConditions.filter(c => c !== value);
        return { conditions: gameState.activeConditions };
      case 'visit_location':
        if (value && !gameState.visitedLocations.includes(value)) {
          gameState.visitedLocations.push(value);
        }
        return { visited: gameState.visitedLocations };
      default:
        return { error: 'Unknown action' };
    }
  },
});
