import { tool } from 'ai';
import { z } from 'zod';

function parseDice(notation: string): { count: number; sides: number; modifier: number } {
  const match = notation.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
  if (!match) return { count: 1, sides: 20, modifier: 0 };
  return {
    count: parseInt(match[1] || '1', 10),
    sides: parseInt(match[2], 10),
    modifier: parseInt(match[3] || '0', 10),
  };
}

export function rollDice(notation: string): { rolls: number[]; modifier: number; total: number } {
  const { count, sides, modifier } = parseDice(notation);
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }
  const total = rolls.reduce((a, b) => a + b, 0) + modifier;
  return { rolls, modifier, total };
}

export const diceTool = tool({
  description: 'Roll dice using standard notation (e.g., 2d6, 1d20+5, 3d8-2). Use for ability checks, attack rolls, damage, saving throws.',
  parameters: z.object({
    notation: z.string().describe('Dice notation like "2d6+3" or "1d20"'),
    reason: z.string().optional().describe('Why the roll is happening, e.g. "Perception check", "Attack roll"'),
  }),
  execute: async ({ notation, reason }) => {
    const result = rollDice(notation);
    return {
      notation,
      rolls: result.rolls,
      modifier: result.modifier,
      total: result.total,
      reason,
    };
  },
});
