import { tool } from 'ai';
import { z } from 'zod';

const PREFIXES = ['Thorn', 'Shadow', 'Iron', 'Storm', 'Moon', 'Dark', 'Silver', 'Blood', 'Frost', 'Ember', 'Ash', 'Stone', 'Wind', 'Fire', 'Night'];
const SUFFIXES = ['wood', 'vale', 'keep', 'fall', 'haven', 'reach', 'mere', 'holm', 'ford', 'gate', 'watch', 'peak', 'dale', 'moor', 'crest'];
const NPC_FIRST = ['Aldric', 'Brenna', 'Cassian', 'Dara', 'Elric', 'Fiona', 'Gareth', 'Helena', 'Ivar', 'Jorah', 'Kira', 'Leander', 'Mira', 'Nolan', 'Orin'];
const NPC_LAST = ['Blackthorn', 'Stoneheart', 'Nightwhisper', 'Ironforge', 'Moonweaver', 'Stormrider', 'Ashwood', 'Silvervane', 'Duskwalker', 'Brightblade'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(type: string): string {
  switch (type) {
    case 'npc':
      return `${pick(NPC_FIRST)} ${pick(NPC_LAST)}`;
    case 'location':
    case 'tavern':
      return `The ${pick(PREFIXES)} ${pick(SUFFIXES).charAt(0).toUpperCase() + pick(SUFFIXES).slice(1)}`;
    case 'item':
      return `${pick(PREFIXES)}${pick(SUFFIXES).slice(0, 3)}`;
    case 'monster':
      return `${pick(PREFIXES)} ${pick(['Beast', 'Wraith', 'Horror', 'Fiend', 'Lurker', 'Drake'])}`;
    default:
      return `${pick(PREFIXES)}${pick(SUFFIXES)}`;
  }
}

export const nameGeneratorTool = tool({
  description: 'Generate fantasy names for NPCs, locations, taverns, items, or monsters on the fly.',
  parameters: z.object({
    type: z.enum(['npc', 'location', 'tavern', 'item', 'monster']),
    count: z.number().default(1).describe('How many names to generate'),
  }),
  execute: async ({ type, count }) => {
    const names = Array.from({ length: count }, () => generateName(type));
    return { type, names };
  },
});
