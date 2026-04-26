import type { Terminal } from "@xterm/xterm";
import { ANSI } from "./ansi";

/**
 * Catalogue of slash commands shown when the user starts typing `/`.
 * Hint is the inline arg pattern (or empty string), summary is the
 * one-liner. Keep these aligned with command-router.ts.
 */
const COMMANDS: Array<{ name: string; hint: string; summary: string }> = [
  { name: "/auto", hint: "[on|off]", summary: "toggle agent auto-drive" },
  { name: "/map", hint: "", summary: "focus the Map Editor" },
  { name: "/story", hint: "", summary: "focus the Story Boarder" },
  { name: "/export", hint: "[-f]", summary: "download project JSON" },
  { name: "/roll", hint: "<dice>", summary: "roll dice (e.g. /roll 2d6+3)" },
  { name: "/clear", hint: "", summary: "clear the terminal" },
  { name: "/help", hint: "", summary: "full command list" },
];

/**
 * Inline command palette rendered inside xterm using only relative
 * cursor moves (no save/restore — those aren't reliable across scrolls).
 *
 * Lifecycle:
 *   - refresh(buffer)   — re-render filtered list under the prompt line
 *   - erase(bufferLen)  — wipe everything we drew so the prompt advances cleanly
 *   - complete(buffer)  — return tab-completion (longest common prefix or full match)
 *
 * Visibility rule: shows when the buffer starts with `/` and contains no
 * whitespace yet. Once the user types a space (i.e. starts entering args),
 * the menu collapses out of the way.
 */
export class CommandMenu {
  private term: Terminal;
  private linesDrawn = 0;

  constructor(term: Terminal) {
    this.term = term;
  }

  private shouldShow(buffer: string): boolean {
    return buffer.startsWith("/") && !/\s/.test(buffer);
  }

  private filtered(buffer: string) {
    const q = buffer.toLowerCase();
    return COMMANDS.filter((c) => c.name.startsWith(q));
  }

  /**
   * Erase whatever the menu most recently drew. `bufferLen` is how many
   * characters the user typed after the prompt sigil — we use it to know
   * how far back to step before walking down to clear our rows.
   */
  erase(_bufferLen: number): void {
    if (this.linesDrawn === 0) return;
    const term = this.term;
    // Move cursor down `linesDrawn` rows from the prompt line, clearing each.
    for (let i = 0; i < this.linesDrawn; i++) {
      term.write("\x1b[1B"); // down 1
      term.write("\r"); // col 0
      term.write("\x1b[2K"); // clear entire line
    }
    // Move back up to where we started, then back to the cursor's
    // original column.
    term.write(`\x1b[${this.linesDrawn}A`);
    this.linesDrawn = 0;
  }

  /**
   * Re-render the menu for the current buffer. Erases any previous draw first.
   * Cursor is left exactly where it started (right after the typed buffer).
   */
  refresh(buffer: string): void {
    this.erase(buffer.length);
    if (!this.shouldShow(buffer)) return;

    const matches = this.filtered(buffer);
    if (matches.length === 0) return;

    const term = this.term;
    // Compute padding for clean alignment.
    const widest = matches.reduce(
      (n, c) => Math.max(n, c.name.length + (c.hint ? c.hint.length + 1 : 0)),
      0,
    );

    // For each row, drop down to a fresh line, draw, then come back up
    // at the end so the cursor is restored to the prompt position.
    for (const cmd of matches) {
      term.write("\r\n"); // newline
      term.write("\x1b[2K"); // clear that line
      const head = cmd.hint ? `${cmd.name} ${cmd.hint}` : cmd.name;
      const padded = head.padEnd(widest, " ");
      term.write(`${ANSI.dimText}  ${ANSI.amber}${padded}${ANSI.reset}${ANSI.dimText}  ${cmd.summary}${ANSI.reset}`);
    }
    this.linesDrawn = matches.length;

    // Walk cursor back up to original line, then forward to original column.
    term.write(`\x1b[${this.linesDrawn}A`);
    term.write("\r");
    // Re-position cursor to end of the prompt + buffer. The prompt sigil
    // contributes 2 visible columns (`› `), plus buffer.length.
    const col = 2 + buffer.length;
    if (col > 0) term.write(`\x1b[${col}C`);
  }

  /**
   * Return tab-completion for the current buffer:
   *  - 0 matches → null (no-op)
   *  - 1 match  → full command + trailing space
   *  - >1 matches → longest common prefix (or null if it equals buffer)
   */
  complete(buffer: string): string | null {
    if (!this.shouldShow(buffer)) return null;
    const matches = this.filtered(buffer);
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0].name + " ";

    // Longest common prefix.
    let prefix = matches[0].name;
    for (const c of matches) {
      while (!c.name.startsWith(prefix)) {
        prefix = prefix.slice(0, -1);
        if (!prefix) return null;
      }
    }
    return prefix.length > buffer.length ? prefix : null;
  }
}
