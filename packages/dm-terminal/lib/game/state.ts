import type { DiceRollResult } from '@dnd-agent/shared';
import { rollDice } from '../ai/tools/dice';

export function localRoll(notation: string): DiceRollResult {
  const result = rollDice(notation);
  return {
    notation,
    ...result,
  };
}
