export const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  narration: '\x1b[32m',
  speech: '\x1b[1;33m',
  mechanic: '\x1b[33m',
  system: '\x1b[36m',
  danger: '\x1b[1;31m',
  magic: '\x1b[35m',
  loot: '\x1b[1;33m',
  input: '\x1b[37m',
  dimText: '\x1b[2;37m',
  error: '\x1b[31m',

  clearLine: '\x1b[2K',
  cursorToStart: '\r',
  cursorUp: '\x1b[A',
  cursorDown: '\x1b[B',
  cursorForward: '\x1b[C',
  cursorBack: '\x1b[D',
  saveCursor: '\x1b[s',
  restoreCursor: '\x1b[u',
} as const;

export function colorize(text: string, color: string): string {
  return `${color}${text}${ANSI.reset}`;
}

export function green(text: string) { return colorize(text, ANSI.narration); }
export function yellow(text: string) { return colorize(text, ANSI.mechanic); }
export function cyan(text: string) { return colorize(text, ANSI.system); }
export function red(text: string) { return colorize(text, ANSI.danger); }
export function magenta(text: string) { return colorize(text, ANSI.magic); }
export function dim(text: string) { return colorize(text, ANSI.dimText); }
export function bold(text: string) { return `${ANSI.bold}${text}${ANSI.reset}`; }
