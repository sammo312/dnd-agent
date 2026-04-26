import { ANSI } from './ansi';

export function formatNarration(text: string): string {
  let formatted = text;
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, `${ANSI.bold}$1${ANSI.reset}${ANSI.narration}`);
  formatted = formatted.replace(/\*(.+?)\*/g, `${ANSI.italic}$1${ANSI.reset}${ANSI.narration}`);
  formatted = formatted.replace(/"([^"]+)"/g, `${ANSI.speech}"$1"${ANSI.reset}${ANSI.narration}`);
  return `${ANSI.narration}${formatted}${ANSI.reset}`;
}

export function formatDiceRoll(notation: string, rolls: number[], modifier: number, total: number, reason?: string): string {
  const rollStr = rolls.map(r => `[${r}]`).join(' + ');
  const modStr = modifier !== 0 ? ` ${modifier > 0 ? '+' : ''}${modifier}` : '';
  const reasonStr = reason ? ` (${reason})` : '';
  return `\r\n${ANSI.mechanic}⚄ ${notation}${reasonStr}: ${rollStr}${modStr} = ${ANSI.bold}${total}${ANSI.reset}\r\n`;
}

export function formatToolResult(toolName: string, result: string): string {
  return `${ANSI.dimText}[${toolName}] ${result}${ANSI.reset}`;
}

export function formatSystemMessage(text: string): string {
  return `${ANSI.system}${text}${ANSI.reset}`;
}

export function formatStatus(text: string): string {
  return `${ANSI.dimText}∙ ${text}${ANSI.reset}\r\n`;
}

export function formatError(text: string): string {
  return `${ANSI.error}Error: ${text}${ANSI.reset}`;
}

/**
 * Amber CRT-phosphor prompt sigil per DESIGN.md.
 * `›` is rendered in the accent-amber tone with a leading space for breathing
 * room, then the input itself is in text-primary so what the DM types is
 * brighter than the prompt.
 */
export function formatPrompt(): string {
  return `\r\n${ANSI.amber}›${ANSI.reset} ${ANSI.input}`;
}

/**
 * Initial terminal welcome. The previous version showed a slash-command
 * list followed by the cryptic "Type your story here" — most new users
 * had no idea what to type. This version leads with what the product
 * IS, then gives a concrete copy-pasteable example prompt that
 * demonstrates the expected input shape, then the slash commands as
 * secondary affordances. Width is held to ~50 cols so it doesn't wrap
 * on a typical workbench panel.
 */
export function formatWelcome(): string {
  // 50-char-wide title bar. ╔═══...═══╗ + 48 inner cells.
  const TITLE = "D M   W O R K B E N C H";
  const BAR = "═".repeat(48);
  const titlePadLeft = " ".repeat(Math.floor((48 - TITLE.length) / 2));
  const titlePadRight = " ".repeat(48 - TITLE.length - titlePadLeft.length);

  return (
    `\r\n` +
    `${ANSI.amber}╔${BAR}╗${ANSI.reset}\r\n` +
    `${ANSI.amber}║${titlePadLeft}${ANSI.bold}${TITLE}${ANSI.reset}${ANSI.amber}${titlePadRight}║${ANSI.reset}\r\n` +
    `${ANSI.amber}╚${BAR}╝${ANSI.reset}\r\n` +
    `${ANSI.dimText}         AI scene prep for tabletop RPGs${ANSI.reset}\r\n` +
    `\r\n` +
    `${ANSI.text}  The agent designs playable scenes — map, NPCs,${ANSI.reset}\r\n` +
    `${ANSI.text}  dialogue — from a one-line description.${ANSI.reset}\r\n` +
    `\r\n` +
    `${ANSI.dimText}  Try this:${ANSI.reset}\r\n` +
    `${ANSI.amber}    ›${ANSI.reset} ${ANSI.italic}${ANSI.text}build me a haunted village with a missing miller${ANSI.reset}\r\n` +
    `\r\n` +
    `${ANSI.dimText}  /auto    have the agent design end-to-end${ANSI.reset}\r\n` +
    `${ANSI.dimText}  /map     focus the Map Editor${ANSI.reset}\r\n` +
    `${ANSI.dimText}  /story   focus the Story Boarder${ANSI.reset}\r\n` +
    `${ANSI.dimText}  /help    full command list${ANSI.reset}\r\n`
  );
}

/**
 * Quiet single-line breadcrumb for an agent tool call.
 * Renders as `  ∙ tool · args` in dim text — read-only telemetry, not a CTA.
 */
export function formatToolCall(label: string): string {
  return `  ${ANSI.dimText}∙ ${label}${ANSI.reset}\r\n`;
}
