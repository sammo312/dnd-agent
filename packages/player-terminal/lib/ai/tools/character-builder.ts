import { tool } from 'ai';
import { z } from 'zod';
import type { CharacterSheet, AbilityScores } from '@dnd-agent/shared';
import { rollDice } from '@dnd-agent/dm-terminal/lib/ai/tools/dice';

let characterSheet: CharacterSheet = {
  id: crypto.randomUUID(),
  name: '',
  race: '',
  class: '',
  level: 1,
  backstory: '',
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    wisdom: 10,
    intelligence: 10,
    charisma: 10,
  },
  hitPoints: { current: 10, max: 10 },
  armorClass: 10,
  proficiencies: [],
  equipment: [],
  spells: [],
  features: [],
  notes: '',
};

export function getCharacterSheet(): CharacterSheet {
  return { ...characterSheet };
}

export const characterBuilderTool = tool({
  description:
    'Manage the player\'s character sheet. Use this to help build and track their character — set name, race, class, ability scores, backstory, proficiencies, equipment, and more.',
  parameters: z.object({
    action: z.enum([
      'get_sheet',
      'set_name',
      'set_race',
      'set_class',
      'set_ability_scores',
      'roll_ability_scores',
      'set_backstory',
      'add_proficiency',
      'remove_proficiency',
      'add_equipment',
      'remove_equipment',
      'add_spell',
      'add_feature',
      'set_hit_points',
      'set_armor_class',
      'set_level',
      'set_notes',
    ]),
    value: z
      .string()
      .optional()
      .describe(
        'The value for the action. For set_ability_scores, pass JSON like {"strength":14,"dexterity":12,...}. For add_equipment, pass JSON like {"name":"Longsword","type":"weapon"}. For set_hit_points, pass JSON like {"current":25,"max":25}.'
      ),
  }),
  execute: async ({ action, value }) => {
    switch (action) {
      case 'get_sheet':
        return { ...characterSheet };

      case 'set_name':
        if (value) characterSheet.name = value;
        return { name: characterSheet.name };

      case 'set_race':
        if (value) characterSheet.race = value;
        return { race: characterSheet.race };

      case 'set_class':
        if (value) characterSheet.class = value;
        return { class: characterSheet.class };

      case 'set_ability_scores':
        if (value) {
          try {
            const scores = JSON.parse(value) as Partial<AbilityScores>;
            characterSheet.abilityScores = {
              ...characterSheet.abilityScores,
              ...scores,
            };
          } catch {
            return { error: 'Invalid JSON for ability scores' };
          }
        }
        return { abilityScores: characterSheet.abilityScores };

      case 'roll_ability_scores': {
        // Roll 4d6 drop lowest for each ability
        const abilities: (keyof AbilityScores)[] = [
          'strength',
          'dexterity',
          'constitution',
          'wisdom',
          'intelligence',
          'charisma',
        ];
        const rolls: Record<string, { rolls: number[]; dropped: number; total: number }> = {};
        for (const ability of abilities) {
          const result = rollDice('4d6');
          const sorted = [...result.rolls].sort((a, b) => a - b);
          const dropped = sorted[0];
          const kept = sorted.slice(1);
          const total = kept.reduce((a, b) => a + b, 0);
          characterSheet.abilityScores[ability] = total;
          rolls[ability] = { rolls: result.rolls, dropped, total };
        }
        return { method: '4d6 drop lowest', rolls, abilityScores: characterSheet.abilityScores };
      }

      case 'set_backstory':
        if (value) characterSheet.backstory = value;
        return { backstory: characterSheet.backstory };

      case 'add_proficiency':
        if (value && !characterSheet.proficiencies.includes(value)) {
          characterSheet.proficiencies.push(value);
        }
        return { proficiencies: characterSheet.proficiencies };

      case 'remove_proficiency':
        characterSheet.proficiencies = characterSheet.proficiencies.filter(
          (p) => p !== value
        );
        return { proficiencies: characterSheet.proficiencies };

      case 'add_equipment':
        if (value) {
          try {
            const item = JSON.parse(value);
            characterSheet.equipment.push({
              id: crypto.randomUUID(),
              name: item.name || 'Unknown Item',
              description: item.description || '',
              quantity: item.quantity || 1,
              type: item.type || 'misc',
            });
          } catch {
            return { error: 'Invalid JSON for equipment' };
          }
        }
        return { equipment: characterSheet.equipment };

      case 'remove_equipment':
        characterSheet.equipment = characterSheet.equipment.filter(
          (e) => e.name.toLowerCase() !== value?.toLowerCase()
        );
        return { equipment: characterSheet.equipment };

      case 'add_spell':
        if (value && !characterSheet.spells?.includes(value)) {
          characterSheet.spells = characterSheet.spells ?? [];
          characterSheet.spells.push(value);
        }
        return { spells: characterSheet.spells };

      case 'add_feature':
        if (value && !characterSheet.features.includes(value)) {
          characterSheet.features.push(value);
        }
        return { features: characterSheet.features };

      case 'set_hit_points':
        if (value) {
          try {
            const hp = JSON.parse(value);
            characterSheet.hitPoints = {
              current: hp.current ?? characterSheet.hitPoints.current,
              max: hp.max ?? characterSheet.hitPoints.max,
            };
          } catch {
            return { error: 'Invalid JSON for hit points' };
          }
        }
        return { hitPoints: characterSheet.hitPoints };

      case 'set_armor_class':
        if (value) characterSheet.armorClass = parseInt(value, 10) || characterSheet.armorClass;
        return { armorClass: characterSheet.armorClass };

      case 'set_level':
        if (value) characterSheet.level = parseInt(value, 10) || characterSheet.level;
        return { level: characterSheet.level };

      case 'set_notes':
        if (value) characterSheet.notes = value;
        return { notes: characterSheet.notes };

      default:
        return { error: 'Unknown action' };
    }
  },
});
