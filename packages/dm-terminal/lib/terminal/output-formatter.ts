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

export function formatWelcome(): string {
  return (
    `\r\n` +
    `${ANSI.dimText}  /auto    let the agent drive${ANSI.reset}\r\n` +
    `${ANSI.dimText}  /map     focus Map Editor${ANSI.reset}\r\n` +
    `${ANSI.dimText}  /story   focus Story Boarder${ANSI.reset}\r\n` +
    `${ANSI.dimText}  /roll    roll dice${ANSI.reset}\r\n` +
    `${ANSI.dimText}  /export  download JSON${ANSI.reset}\r\n` +
    `${ANSI.dimText}  /help    full command list${ANSI.reset}\r\n` +
    `\r\n` +
    `${ANSI.text}Type your story here.${ANSI.reset}\r\n`
  );
}

/**
 * Quiet single-line breadcrumb for an agent tool call.
 * Renders as `  ∙ tool · args` in dim text — read-only telemetry, not a CTA.
 */
export function formatToolCall(label: string): string {
  return `  ${ANSI.dimText}∙ ${label}${ANSI.reset}\r\n`;
}
