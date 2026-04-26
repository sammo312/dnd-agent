import { localRoll, type CommandResult } from '@dnd-agent/dm-terminal';
import { formatDiceRoll, formatSystemMessage, formatError } from '@dnd-agent/dm-terminal/lib/terminal/output-formatter';
import { ANSI } from '@dnd-agent/dm-terminal/lib/terminal/ansi';
import { getCharacterSheet } from '../ai/tools/character-builder';

function formatSheetSummary(): string {
  const sheet = getCharacterSheet();
  const lines: string[] = [];

  lines.push(`\r\n${ANSI.system}${ANSI.bold}Character Sheet${ANSI.reset}`);
  lines.push(`${ANSI.system}${'─'.repeat(40)}${ANSI.reset}`);

  if (sheet.name) {
    lines.push(`${ANSI.narration}  Name:  ${ANSI.bold}${sheet.name}${ANSI.reset}`);
  } else {
    lines.push(`${ANSI.dimText}  Name:  (not set)${ANSI.reset}`);
  }

  if (sheet.race) {
    lines.push(`${ANSI.narration}  Race:  ${sheet.race}${ANSI.reset}`);
  } else {
    lines.push(`${ANSI.dimText}  Race:  (not set)${ANSI.reset}`);
  }

  if (sheet.class) {
    lines.push(`${ANSI.narration}  Class: ${sheet.class} (Level ${sheet.level})${ANSI.reset}`);
  } else {
    lines.push(`${ANSI.dimText}  Class: (not set)${ANSI.reset}`);
  }

  lines.push(`${ANSI.narration}  HP:    ${sheet.hitPoints.current}/${sheet.hitPoints.max}  AC: ${sheet.armorClass}${ANSI.reset}`);

  const { strength, dexterity, constitution, wisdom, intelligence, charisma } = sheet.abilityScores;
  lines.push(`${ANSI.mechanic}  STR ${strength}  DEX ${dexterity}  CON ${constitution}  WIS ${wisdom}  INT ${intelligence}  CHA ${charisma}${ANSI.reset}`);

  if (sheet.proficiencies.length > 0) {
    lines.push(`${ANSI.dimText}  Proficiencies: ${sheet.proficiencies.join(', ')}${ANSI.reset}`);
  }

  if (sheet.equipment.length > 0) {
    lines.push(`${ANSI.dimText}  Equipment: ${sheet.equipment.map((e) => e.name).join(', ')}${ANSI.reset}`);
  }

  if (sheet.spells && sheet.spells.length > 0) {
    lines.push(`${ANSI.magic}  Spells: ${sheet.spells.join(', ')}${ANSI.reset}`);
  }

  lines.push(`${ANSI.system}${'─'.repeat(40)}${ANSI.reset}`);
  lines.push('');

  return lines.join('\r\n');
}

export function routePlayerCommand(input: string): CommandResult | null {
  const parts = input.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  switch (cmd) {
    case '/roll': {
      const notation = args || '1d20';
      const result = localRoll(notation);
      return {
        output: formatDiceRoll(notation, result.rolls, result.modifier, result.total),
      };
    }

    case '/sheet':
      return {
        output: formatSheetSummary(),
      };

    case '/help':
      return {
        output:
          `\r\n${ANSI.system}Available Commands:${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /roll <dice>      Roll dice (e.g., /roll 2d6+3)${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /sheet            View your character sheet${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /recap            Get a story recap${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /advice <topic>   Ask for advice on a topic${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /help             Show this help message${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /clear            Clear the terminal${ANSI.reset}\r\n` +
          `${ANSI.dimText}${ANSI.reset}\r\n` +
          `${ANSI.dimText}  Or just type naturally to chat!${ANSI.reset}\r\n`,
      };

    case '/clear':
      return { output: '\x1b[2J\x1b[H' };

    case '/recap':
      return {
        output: '',
        sendToAI: true,
        aiMessage: 'Give me a recap of recent events in the adventure. What has happened so far and what should I be focused on?',
      };

    case '/advice': {
      const topic = args || 'general gameplay';
      return {
        output: '',
        sendToAI: true,
        aiMessage: `Give me advice about: ${topic}`,
      };
    }

    default:
      if (cmd.startsWith('/')) {
        return {
          output: formatError(`Unknown command: ${cmd}. Type /help for available commands.`) + '\r\n',
        };
      }
      return null;
  }
}
