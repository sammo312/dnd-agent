import type { InventoryItem } from './game';

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  wisdom: number;
  intelligence: number;
  charisma: number;
}

export interface CharacterSheet {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  backstory: string;
  abilityScores: AbilityScores;
  hitPoints: { current: number; max: number };
  armorClass: number;
  proficiencies: string[];
  equipment: InventoryItem[];
  spells?: string[];
  features: string[];
  notes: string;
}
