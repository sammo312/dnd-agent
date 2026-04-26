import { ANSI } from './ansi';

/**
 * Compact castle silhouette — keeps the CRT-amber tabletop identity but
 * a third the visual weight of the original 18-line piece. Sized to ~50
 * cols so it fits in a default 80-col terminal alongside the title bar
 * without wrapping in a typical workbench panel.
 *
 * Lines must be joined with explicit `\r\n` because xterm's `\n` does
 * not return the cursor to column 0 — without the `\r`, each ASCII row
 * starts wherever the previous row ended.
 */
const CASTLE_LINES = [
  "                       |>>>",
  "                    _____|_____",
  "                   |;|_|_|_|;|",
  "               _    \\   .   /    _",
  "              |;|    |  ___  |    |;|",
  "              |;|    | |+++| |    |;|",
  "              |_|____| |+++| |____|_|",
  "              |      | |+++| |      |",
  "              |______|_|+++|_|______|",
  "               ~~~~~~~~~~~~~~~~~~~~~~",
];

export const BANNER =
  `\r\n` +
  CASTLE_LINES.map(
    (line) => `${ANSI.amber}${line}${ANSI.reset}\r\n`,
  ).join("");

export const DIVIDER = `${ANSI.dimText}${'─'.repeat(50)}${ANSI.reset}`;

export function diceArt(total: number): string {
  return `${ANSI.mechanic}⚄ ${total}${ANSI.reset}`;
}
