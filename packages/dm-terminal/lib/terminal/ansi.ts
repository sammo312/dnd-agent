/**
 * Truecolor (24-bit) ANSI palette aligned to DESIGN.md.
 *
 * RGB values are perceptual conversions of the OKLCH tokens defined in
 * the design system. xterm.js supports the SGR 38;2;R;G;B sequence on
 * the canvas + WebGL renderers, so we get pixel-accurate brand colors
 * inside the terminal.
 */

const fg = (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`;
const bg = (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`;

// ── Text ────────────────────────────────────────────────
// --text-primary  oklch(0.88 0.03 80)  → warm off-white
const C_TEXT = fg(226, 218, 200);
// --text-muted    oklch(0.50 0.02 70)  → warm gray
const C_MUTED = fg(130, 120, 107);
// --text-dim      oklch(0.35 0.01 70)  → near-border gray
const C_DIM = fg(84, 73, 61);

// ── Accents (CRT phosphor) ──────────────────────────────
// --accent-amber   oklch(0.78 0.16 75)
const C_AMBER = fg(232, 168, 67);
// --accent-green   oklch(0.70 0.17 150)
const C_GREEN = fg(63, 184, 116);
// --accent-cyan    oklch(0.68 0.12 195)
const C_CYAN = fg(63, 177, 189);
// --accent-crimson oklch(0.52 0.19 25)
const C_CRIMSON = fg(193, 67, 51);
// --accent-violet  oklch(0.52 0.14 300)
const C_VIOLET = fg(138, 74, 170);

// ── Surfaces ────────────────────────────────────────────
const BG_DEEP = bg(26, 22, 18);
const BG_SURFACE = bg(34, 32, 28);
const BG_ELEVATED = bg(44, 39, 34);

export const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",

  // Semantic palette (preferred names going forward).
  text: C_TEXT,
  muted: C_MUTED,
  dimColor: C_DIM,
  amber: C_AMBER,
  green: C_GREEN,
  cyan: C_CYAN,
  crimson: C_CRIMSON,
  violet: C_VIOLET,

  bgDeep: BG_DEEP,
  bgSurface: BG_SURFACE,
  bgElevated: BG_ELEVATED,

  // ── Legacy semantic aliases (used across the codebase). ──
  // narration  → DM-to-DM body text (text-primary)
  narration: C_TEXT,
  // input      → what the user is typing (text-primary)
  input: C_TEXT,
  // system     → prompt glyphs, command headers, key hints (amber/CRT phosphor)
  system: C_AMBER,
  // dimText    → secondary metadata, slash-command hints
  dimText: C_MUTED,
  // mechanic   → dice rolls, numerical / system mechanic output
  mechanic: C_AMBER,
  // speech     → in-fiction speech (amber bold)
  speech: `\x1b[1m${C_AMBER}`,
  // danger     → strong warnings, combat banners
  danger: `\x1b[1m${C_CRIMSON}`,
  // error      → tool failures, transport errors
  error: C_CRIMSON,
  // magic      → magical / metaphysical content
  magic: C_VIOLET,
  // loot       → reward / treasure callouts
  loot: `\x1b[1m${C_AMBER}`,

  // ── Cursor & line controls ──────────────────────────────
  clearLine: "\x1b[2K",
  clearLineFromCursor: "\x1b[0K",
  clearLineToCursor: "\x1b[1K",
  clearScreen: "\x1b[2J",
  clearScreenFromCursor: "\x1b[0J",
  cursorToStart: "\r",
  cursorUp: "\x1b[A",
  cursorDown: "\x1b[B",
  cursorForward: "\x1b[C",
  cursorBack: "\x1b[D",
  cursorHome: "\x1b[H",
  saveCursor: "\x1b[s",
  restoreCursor: "\x1b[u",
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
} as const;

export function up(n: number): string {
  return n > 0 ? `\x1b[${n}A` : "";
}
export function down(n: number): string {
  return n > 0 ? `\x1b[${n}B` : "";
}

export function colorize(text: string, color: string): string {
  return `${color}${text}${ANSI.reset}`;
}

export function amber(text: string) {
  return colorize(text, ANSI.amber);
}
export function green(text: string) {
  return colorize(text, ANSI.green);
}
export function cyan(text: string) {
  return colorize(text, ANSI.cyan);
}
export function crimson(text: string) {
  return colorize(text, ANSI.crimson);
}
export function violet(text: string) {
  return colorize(text, ANSI.violet);
}
export function muted(text: string) {
  return colorize(text, ANSI.muted);
}
export function dim(text: string) {
  return colorize(text, ANSI.dimColor);
}
export function bold(text: string) {
  return `${ANSI.bold}${text}${ANSI.reset}`;
}

// Legacy aliases (older code calls these).
export const yellow = amber;
export const magenta = violet;
export const red = crimson;
