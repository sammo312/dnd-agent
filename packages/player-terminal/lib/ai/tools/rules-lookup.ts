import { tool } from 'ai';
import { z } from 'zod';

const RULES_REFERENCE: Record<string, string> = {
  advantage:
    'When you have advantage, roll two d20s and take the higher result. Disadvantage is the opposite — roll two and take the lower. They cancel each other out regardless of how many sources of each you have.',
  'ability check':
    'Roll 1d20 + ability modifier + proficiency bonus (if proficient). The DM sets the DC: 5 (very easy), 10 (easy), 15 (medium), 20 (hard), 25 (very hard), 30 (nearly impossible).',
  'saving throw':
    'Roll 1d20 + ability modifier + proficiency bonus (if proficient in that save). Each class grants proficiency in two saving throws.',
  'attack roll':
    'Roll 1d20 + ability modifier + proficiency bonus. Melee uses Strength (or Dex for finesse weapons). Ranged uses Dexterity. Spell attacks use your spellcasting ability.',
  'armor class':
    'AC determines how hard you are to hit. Base AC varies: unarmored (10 + Dex mod), light armor (armor + Dex mod), medium armor (armor + Dex mod, max +2), heavy armor (armor value, no Dex). Shields add +2.',
  'hit points':
    'At 1st level, HP = hit die maximum + Constitution modifier. Each level after, roll your hit die (or take average) + Con mod. At 0 HP you fall unconscious and make death saving throws.',
  'death saves':
    'When at 0 HP, roll d20 at start of each turn. 10+ = success, 9 or below = failure. Three successes stabilize you. Three failures = death. Natural 20 = regain 1 HP. Natural 1 = two failures.',
  'short rest':
    'A short rest is at least 1 hour. You can spend Hit Dice to heal (roll + Con mod per die). Some class features recharge on a short rest.',
  'long rest':
    'A long rest is at least 8 hours (6 sleeping, 2 light activity). You regain all HP and up to half your total Hit Dice. Most features and all spell slots recharge.',
  concentration:
    'Some spells require concentration. You can only concentrate on one spell at a time. Taking damage requires a Con save (DC = half damage taken, minimum 10). Casting another concentration spell ends the first.',
  'opportunity attack':
    'When a hostile creature you can see moves out of your reach, you can use your reaction to make one melee attack against it. You can avoid this by using the Disengage action.',
  'bonus action':
    'Some abilities and spells use a bonus action. You get one per turn. You can only use it if something grants you one. If a spell uses a bonus action, the only other spell you can cast that turn is a cantrip with a casting time of 1 action.',
  conditions:
    'Common conditions: Blinded, Charmed, Deafened, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious. Each has specific mechanical effects.',
  'spell slots':
    'Spell slots are a resource for casting spells. Each spell level has a number of slots determined by your class level. You can cast a spell using a higher-level slot for enhanced effects. Slots recharge on a long rest (except warlock).',
  cantrips:
    'Cantrips are 0-level spells that can be cast at will without using a spell slot. Their damage scales at levels 5, 11, and 17.',
  'critical hit':
    'On a natural 20 attack roll, you score a critical hit. Roll all damage dice twice and add them together, then add modifiers. Some features expand the crit range.',
  proficiency:
    'Your proficiency bonus starts at +2 and increases as you level up: +2 (levels 1-4), +3 (5-8), +4 (9-12), +5 (13-16), +6 (17-20). Added to attack rolls, saves, and skill checks you are proficient in.',
  initiative:
    'At the start of combat, everyone rolls initiative: 1d20 + Dexterity modifier. This determines the turn order. Higher goes first. Ties broken by higher Dex modifier.',
};

const CLASS_INFO: Record<string, string> = {
  barbarian:
    'Hit Die: d12. Primary: Strength. Saves: Str & Con. Rage grants bonus damage, resistance to physical damage, and advantage on Str checks. Unarmored Defense (10 + Dex + Con). Reckless Attack for advantage at cost of enemies having advantage on you.',
  bard:
    'Hit Die: d8. Primary: Charisma. Saves: Dex & Cha. Full spellcaster. Bardic Inspiration gives allies bonus dice. Jack of All Trades adds half proficiency to non-proficient checks. Versatile with Magical Secrets.',
  cleric:
    'Hit Die: d8. Primary: Wisdom. Saves: Wis & Cha. Full spellcaster. Divine Domain chosen at 1st level shapes abilities. Channel Divinity for powerful effects. Can prepare different spells each day. Best healer.',
  druid:
    'Hit Die: d8. Primary: Wisdom. Saves: Int & Wis. Full spellcaster. Wild Shape to transform into beasts. Strong nature-themed spells. Can prepare different spells each day. Cannot wear metal armor.',
  fighter:
    'Hit Die: d10. Primary: Str or Dex. Saves: Str & Con. Action Surge for an extra action. Second Wind for self-healing. Most ASIs/feats of any class. Fighting Style at 1st level. Extra Attack at 5th, 11th, and 20th.',
  monk:
    'Hit Die: d8. Primary: Dex & Wis. Saves: Str & Dex. Ki points fuel special abilities. Martial Arts for unarmed strikes with Dex. Unarmored Defense (10 + Dex + Wis). Stunning Strike, Deflect Missiles, Evasion.',
  paladin:
    'Hit Die: d10. Primary: Str & Cha. Saves: Wis & Cha. Half-caster. Divine Smite adds radiant damage to melee hits (uses spell slots). Lay on Hands for healing pool. Aura of Protection adds Cha mod to nearby saves.',
  ranger:
    'Hit Die: d10. Primary: Dex & Wis. Saves: Str & Dex. Half-caster. Favored Enemy and Natural Explorer for exploration. Fighting Style. Extra Attack at 5th level. Good mix of combat and utility.',
  rogue:
    'Hit Die: d8. Primary: Dexterity. Saves: Dex & Int. Sneak Attack adds massive damage once per turn (requires advantage or ally adjacent). Expertise doubles proficiency on chosen skills. Cunning Action for bonus action Dash/Disengage/Hide. Evasion.',
  sorcerer:
    'Hit Die: d6. Primary: Charisma. Saves: Con & Cha. Full spellcaster. Sorcery Points and Metamagic let you modify spells (Quicken, Twin, Subtle). Fewer spells known but very flexible casting.',
  warlock:
    'Hit Die: d8. Primary: Charisma. Saves: Wis & Cha. Pact Magic: fewer slots but they recharge on short rest and are always max level. Eldritch Invocations for customization. Eldritch Blast is the premier cantrip.',
  wizard:
    'Hit Die: d6. Primary: Intelligence. Saves: Int & Wis. Full spellcaster. Largest spell list. Spellbook can learn new spells from scrolls. Arcane Recovery restores slots on short rest. Arcane Tradition at 2nd level.',
};

const RACE_INFO: Record<string, string> = {
  human:
    'Versatile and ambitious. +1 to all ability scores (or variant: +1 to two scores, one skill proficiency, and one feat). Common language plus one extra. Good for any class.',
  elf:
    '+2 Dexterity. Darkvision 60ft. Keen Senses (Perception proficiency). Fey Ancestry (advantage vs charm, immune to magical sleep). Trance (4hr long rest). Subraces: High Elf (+1 Int, cantrip), Wood Elf (+1 Wis, faster, Mask of the Wild), Drow (+1 Cha, superior darkvision).',
  dwarf:
    '+2 Constitution. Darkvision 60ft. Dwarven Resilience (advantage vs poison, resistance to poison damage). Tool proficiency. Stonecunning. Speed 25ft (not reduced by heavy armor). Subraces: Hill (+1 Wis, +1 HP/level), Mountain (+2 Str, medium armor).',
  halfling:
    '+2 Dexterity. Lucky (reroll natural 1s on attacks, checks, saves). Brave (advantage vs frightened). Halfling Nimbleness (move through larger creatures). Speed 25ft. Subraces: Lightfoot (+1 Cha, hide behind larger creatures), Stout (+1 Con, poison resistance).',
  dragonborn:
    '+2 Strength, +1 Charisma. Draconic Ancestry gives breath weapon (damage type based on dragon color) and resistance to that damage type. No darkvision. Proud and honorable.',
  gnome:
    '+2 Intelligence. Darkvision 60ft. Gnome Cunning (advantage on Int/Wis/Cha saves vs magic). Small size. Subraces: Forest (+1 Dex, Minor Illusion, speak with small beasts), Rock (+1 Con, tinker, artificer lore).',
  'half-elf':
    '+2 Charisma, +1 to two other scores. Darkvision 60ft. Fey Ancestry. Two skill proficiencies. Extra language. Extremely versatile — great for any Charisma class.',
  'half-orc':
    '+2 Strength, +1 Constitution. Darkvision 60ft. Menacing (Intimidation proficiency). Relentless Endurance (drop to 1 HP instead of 0, once per long rest). Savage Attacks (extra die on melee crits).',
  tiefling:
    '+2 Charisma, +1 Intelligence. Darkvision 60ft. Hellish Resistance (fire resistance). Infernal Legacy (Thaumaturgy cantrip, Hellish Rebuke at 3rd, Darkness at 5th). Good for warlocks, sorcerers, and bards.',
};

export const rulesLookupTool = tool({
  description:
    'Look up D&D 5e rules, mechanics, class info, and race info. Use when the player asks about how something works, wants to compare options, or needs a rules clarification.',
  parameters: z.object({
    action: z.enum(['lookup_rule', 'explain_mechanic', 'class_info', 'race_info']),
    value: z
      .string()
      .describe(
        'The rule keyword, mechanic name, class name, or race name to look up.'
      ),
  }),
  execute: async ({ action, value }) => {
    const key = value.toLowerCase().trim();

    switch (action) {
      case 'lookup_rule':
      case 'explain_mechanic': {
        // Try exact match first, then partial match
        if (RULES_REFERENCE[key]) {
          return { topic: value, explanation: RULES_REFERENCE[key] };
        }
        const partial = Object.entries(RULES_REFERENCE).find(([k]) =>
          k.includes(key) || key.includes(k)
        );
        if (partial) {
          return { topic: partial[0], explanation: partial[1] };
        }
        return {
          topic: value,
          explanation: `No specific rule entry found for "${value}". You can ask me to explain it in my own words based on my D&D knowledge.`,
          available_topics: Object.keys(RULES_REFERENCE),
        };
      }

      case 'class_info': {
        if (CLASS_INFO[key]) {
          return { class: value, info: CLASS_INFO[key] };
        }
        return {
          class: value,
          info: `No class info found for "${value}".`,
          available_classes: Object.keys(CLASS_INFO),
        };
      }

      case 'race_info': {
        if (RACE_INFO[key]) {
          return { race: value, info: RACE_INFO[key] };
        }
        return {
          race: value,
          info: `No race info found for "${value}".`,
          available_races: Object.keys(RACE_INFO),
        };
      }

      default:
        return { error: 'Unknown action' };
    }
  },
});
