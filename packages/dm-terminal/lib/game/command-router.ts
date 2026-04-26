import { localRoll } from './state';
import { formatDiceRoll, formatStatus, formatError } from '../terminal/output-formatter';
import { ANSI } from '../terminal/ansi';

export interface CommandResult {
  output: string;
  sendToAI?: boolean;
  aiMessage?: string;
}

/**
 * Side-effects the host terminal can offer to slash commands. The router
 * returns a CommandResult (with output) regardless; if the command needs
 * to mutate app state (toggle auto-mode, focus another panel, export the
 * project) it asks the host via this context.
 */
export interface ExportSummary {
  ok: boolean;
  errorCount: number;
  warningCount: number;
  errors: string[];
  warnings: string[];
  /** Whether the file was actually downloaded. False if blocked by errors. */
  downloaded: boolean;
}

export interface CommandContext {
  /** Toggle DM auto-mode in the dm-context store. Returns the new value. */
  toggleAutoMode?: () => boolean;
  /** Set DM auto-mode explicitly. Returns the new value. */
  setAutoMode?: (enabled: boolean) => boolean;
  /** Focus the Map Editor or Story Boarder panel in Dockview. */
  openSurface?: (surface: 'map' | 'story') => void;
  /**
   * Build the project, validate it, and (if `force` or there are no
   * errors) trigger a JSON download.
   */
  exportProject?: (opts: { force?: boolean }) => ExportSummary;
}

export function routeCommand(
  input: string,
  ctx: CommandContext = {},
): CommandResult | null {
  const parts = input.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case '/roll': {
      const notation = args.join(' ') || '1d20';
      const result = localRoll(notation);
      return {
        output: formatDiceRoll(notation, result.rolls, result.modifier, result.total),
      };
    }

    case '/auto': {
      const flag = args[0]?.toLowerCase();
      let next: boolean;
      if (flag === 'on') {
        next = ctx.setAutoMode?.(true) ?? true;
      } else if (flag === 'off') {
        next = ctx.setAutoMode?.(false) ?? false;
      } else {
        next = ctx.toggleAutoMode?.() ?? false;
      }
      return {
        output: next
          ? formatStatus('auto mode on — agent will drive without asking')
          : formatStatus('auto mode off — agent will ask before deciding'),
      };
    }

    case '/map': {
      ctx.openSurface?.('map');
      return { output: formatStatus('focused Map Editor') };
    }

    case '/story': {
      ctx.openSurface?.('story');
      return { output: formatStatus('focused Story Boarder') };
    }

    case '/export': {
      if (!ctx.exportProject) {
        return { output: formatError('Export is unavailable in this context.') + '\r\n' };
      }
      const force = args[0]?.toLowerCase() === '--force' || args[0]?.toLowerCase() === '-f';
      const summary = ctx.exportProject({ force });
      const lines: string[] = [''];
      if (summary.downloaded) {
        lines.push(formatStatus('exported project.dnd.json — saved to your downloads.'));
      } else if (summary.errorCount > 0) {
        lines.push(formatError(`${summary.errorCount} error(s) blocked export. Re-run with /export --force to download anyway.`));
      } else {
        lines.push(formatError('export failed. See messages above.'));
      }
      for (const e of summary.errors) {
        lines.push(`${ANSI.crimson}  ✗ ${e}${ANSI.reset}`);
      }
      for (const w of summary.warnings) {
        lines.push(`${ANSI.dimText}  ⚠ ${w}${ANSI.reset}`);
      }
      // Friendly next-step prompt only when the file actually shipped.
      if (summary.downloaded) {
        lines.push('');
        lines.push(`${ANSI.amber}  next →${ANSI.reset} ${ANSI.text}open the player app and drop the file onto its import area.${ANSI.reset}`);
      }
      lines.push('');
      return { output: lines.join('\r\n') };
    }

    case '/help':
      return {
        output:
          `\r\n${ANSI.amber}commands${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /auto [on|off]   toggle agent auto-drive${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /map             focus the Map Editor panel${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /story           focus the Story Boarder panel${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /export [-f]     download project JSON (use -f to bypass errors)${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /roll <dice>     roll dice (e.g. /roll 2d6+3)${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /clear           clear the terminal${ANSI.reset}\r\n` +
          `${ANSI.dimText}  /help            show this${ANSI.reset}\r\n` +
          `\r\n` +
          `${ANSI.dimText}or just describe a scene and the agent will sketch it into the editors.${ANSI.reset}\r\n`,
      };

    case '/clear':
      return { output: '\x1b[2J\x1b[H' };

    default:
      if (cmd.startsWith('/')) {
        return {
          output: formatError(`Unknown command: ${cmd}. Type /help for commands.`) + '\r\n',
        };
      }
      return null;
  }
}
