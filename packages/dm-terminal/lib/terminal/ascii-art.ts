import { ANSI } from './ansi';

/**
 * Small text helpers used by the terminal output. The ASCII castle
 * banner that used to live here was retired in favor of a tighter
 * title bar baked into the welcome formatter (see
 * `lib/terminal/output-formatter.ts`).
 */

export const DIVIDER = `${ANSI.dimText}${'─'.repeat(50)}${ANSI.reset}`;

export function diceArt(total: number): string {
  return `${ANSI.mechanic}⚄ ${total}${ANSI.reset}`;
}
