import { ANSI } from './ansi';

/**
 * Castle banner. Lines must be joined with explicit `\r\n` because
 * xterm's `\n` does not return the cursor to column 0 — without the `\r`,
 * each ASCII row starts wherever the previous row ended.
 *
 * The art is ~80 columns wide. In a narrow panel it will wrap; the
 * terminal user can drag the dockview splitter to give it room.
 */
const CASTLE_LINES = [
  "                                  |>>>",
  "                                  |",
  "                    |>>>      _  _|_  _         |>>>",
  "                    |        |;| |;| |;|        |",
  "                _  _|_  _    \\.    .  /    _  _|_  _",
  "               |;|_|;|_|;|    \\:. ,  /    |;|_|;|_|;|",
  "               \\..      /    ||;   . |    \\..      /",
  "                \\.  ,  /     ||:  .  |     \\:  .  /",
  "                 ||:   |_   _ ||_ . _ | _   _||:   |",
  "                 ||:  .|||_|;|_|;|_|;|_|;|_|;||:.  |",
  "                 ||:   ||.    .     .      . ||:  .|",
  "                 ||: . || .     . .   .  ,   ||:   |       \\,/",
  "                 ||:   ||:  ,  _______   .   ||: , |            /`\\",
  "                 ||:   || .   /+++++++\\    . ||:   |",
  "                 ||:   ||.    |+++++++| .    ||: . |",
  "              __ ||: . ||: ,  |+++++++|.  . _||_   |",
  "     ____--`~    '--~~__|.    |+++++++|----~    ~`---,              ___",
  "-~--~                   ~---__|,--~'                  ~~----_____-~'   `~----~~",
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
