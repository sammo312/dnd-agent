import { localRoll } from './state';
import { formatDiceRoll, formatSystemMessage, formatError } from '../terminal/output-formatter';
import { ANSI } from '../terminal/ansi';

export interface CommandResult {
  output: string;
  sendToAI?: boolean;
  aiMessage?: string;
}

export function routeCommand(input: string): CommandResult | null {
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

    case '/help':
      return {
        output: `\r\n${ANSI.system}Commands${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /roll <dice>   Roll dice (e.g. /roll 2d6+3)${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /clear         Clear the terminal${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /help          Show this${ANSI.reset}\r\n` +
          `\r\n` +
          `${ANSI.dimText}Or just describe a scene you want to run and the DM prep assistant will sketch it into the Story Boarder and Map Editor.${ANSI.reset}\r\n`,
      };

    case '/clear':
      return { output: '\x1b[2J\x1b[H' };

    default:
      if (cmd.startsWith('/')) {
        return {
          output: formatError(`Unknown command: ${cmd}. Type /help for available commands.`) + '\r\n',
        };
      }
      return null;
  }
}
