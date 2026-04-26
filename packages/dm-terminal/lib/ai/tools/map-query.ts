import { tool } from 'ai';
import { z } from 'zod';

export const mapQueryTool = tool({
  description: 'Query the world map. Get terrain info at coordinates, list points of interest, describe regions. Use when players ask about their surroundings or travel.',
  parameters: z.object({
    action: z.enum(['get_cell', 'list_pois', 'describe_region', 'get_nearby']),
    x: z.number().optional().describe('X coordinate on the map grid'),
    y: z.number().optional().describe('Y coordinate on the map grid'),
    regionName: z.string().optional().describe('Name of the region to query'),
    radius: z.number().optional().describe('Search radius for get_nearby'),
  }),
  execute: async ({ action, x, y, regionName, radius }) => {
    switch (action) {
      case 'get_cell':
        return { terrain: 'forest', elevation: 2, description: 'Dense woodland with ancient oaks' };
      case 'list_pois':
        return { pois: ['Abandoned watchtower', 'Hidden grove', 'Old bridge'] };
      case 'describe_region':
        return { name: regionName || 'Unknown', description: 'A mysterious region shrouded in mist' };
      case 'get_nearby':
        return { nearby: ['A winding path leads north', 'Smoke rises from the east'] };
      default:
        return { error: 'Unknown action' };
    }
  },
});
