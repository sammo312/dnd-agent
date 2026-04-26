import { ANSI, colorize } from './ansi';

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

export function formatError(text: string): string {
  return `${ANSI.error}Error: ${text}${ANSI.reset}`;
}

export function formatPrompt(): string {
  return `\r\n${ANSI.system}> ${ANSI.input}`;
}

export function formatWelcome(): string {
  return `${ANSI.system}Type anything to speak to your Dungeon Master.${ANSI.reset}\r\n` +
    `${ANSI.dimText}Commands: /roll <dice>, /help, /clear${ANSI.reset}\r\n`;
}
