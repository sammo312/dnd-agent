import { ANSI } from './ansi';

/**
 * dm.prep banner. Lines must be joined with explicit `\r\n` because
 * xterm's `\n` does not return the cursor to column 0 — without the `\r`,
 * each ASCII row starts wherever the previous row ended.
 */
export const BANNER =
  `\r\n` +
  `${ANSI.amber}${ANSI.bold}  ┌──────────────────────────────────┐${ANSI.reset}\r\n` +
  `${ANSI.amber}${ANSI.bold}  │  dm.prep  ${ANSI.reset}${ANSI.dimText}// the living stage${ANSI.reset}${ANSI.amber}${ANSI.bold}     │${ANSI.reset}\r\n` +
  `${ANSI.amber}${ANSI.bold}  └──────────────────────────────────┘${ANSI.reset}\r\n`;

export const DIVIDER = `${ANSI.dimText}${'─'.repeat(50)}${ANSI.reset}`;

export function diceArt(total: number): string {
  return `${ANSI.mechanic}⚄ ${total}${ANSI.reset}`;
}
