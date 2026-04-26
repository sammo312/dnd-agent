import type { Terminal } from "@xterm/xterm";
import { ANSI } from "./ansi";

/**
 * Catalogue of slash commands shown when the user starts typing `/`.
 * Hint is the inline arg pattern (or empty string), summary is the
 * one-liner. Keep these aligned with command-router.ts.
 */
const COMMANDS: Array<{ name: string; hint: string; summary: string }> = [
  { name: "/auto", hint: "[on|off|<message>]", summary: "toggle / steer agent auto-drive" },
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
 *   - refresh(buffer)        — re-render filtered list under the prompt line
 *   - erase()                — wipe everything we drew so the prompt advances cleanly
 *   - moveSelection(±1)      — cycle through filtered entries with arrow keys
 *   - selectedCompletion()   — full command + trailing space for the highlighted row
 *   - complete(buffer)       — tab completion (longest common prefix)
 *
 * Visibility rule: shows when the buffer starts with `/` and contains no
 * whitespace yet. Once the user types a space (i.e. starts entering args),
 * the menu collapses out of the way.
 */
export class CommandMenu {
  private term: Terminal;
  private linesDrawn = 0;
  private lastBuffer = "";
  private selectedIndex = 0;

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

  /** True iff the menu currently has rows on screen. */
  isVisible(): boolean {
    return this.linesDrawn > 0;
  }

  /**
   * Erase whatever the menu most recently drew. Cursor returns to where
   * the user's prompt is, so subsequent writes (newline, fresh prompt,
   * line redraw) start from the right place.
   */
  erase(): void {
    if (this.linesDrawn === 0) return;
    const term = this.term;
    for (let i = 0; i < this.linesDrawn; i++) {
      term.write("\x1b[1B"); // down 1
      term.write("\r"); // col 0
      term.write("\x1b[2K"); // clear entire line
    }
    term.write(`\x1b[${this.linesDrawn}A`);
    this.linesDrawn = 0;
    // Note: lastBuffer/selectedIndex preserved so a subsequent refresh
    // with the same buffer keeps the highlighted row stable.
  }

  /**
   * Re-render the menu for the current buffer. Erases any previous draw
   * first. Cursor is left exactly where it started (right after the
   * typed buffer).
   */
  refresh(buffer: string): void {
    this.erase();

    if (!this.shouldShow(buffer)) {
      this.lastBuffer = buffer;
      this.selectedIndex = 0;
      return;
    }

    // Reset selection to the first row whenever the filter changes,
    // so typing one more character re-anchors the highlight at the top.
    if (buffer !== this.lastBuffer) {
      this.selectedIndex = 0;
    }
    this.lastBuffer = buffer;

    const matches = this.filtered(buffer);
    if (matches.length === 0) return;

    if (this.selectedIndex >= matches.length) {
      this.selectedIndex = matches.length - 1;
    }

    this.draw(matches, buffer);
  }

  /**
   * Cycle the highlighted row by `delta` (+1 / -1), wrapping at the ends.
   * No-op when the menu isn't visible.
   */
  moveSelection(delta: number): void {
    if (!this.isVisible()) return;
    const matches = this.filtered(this.lastBuffer);
    if (matches.length === 0) return;
    const next =
      (this.selectedIndex + delta + matches.length) % matches.length;
    this.selectedIndex = next;
    this.draw(matches, this.lastBuffer);
  }

  /**
   * Returns the full command string (with trailing space) for the
   * currently highlighted row, or null if the menu isn't visible.
   * Used by Enter / Tab to accept the selection.
   */
  selectedCompletion(): string | null {
    if (!this.isVisible()) return null;
    const matches = this.filtered(this.lastBuffer);
    if (matches.length === 0) return null;
    const idx = Math.min(this.selectedIndex, matches.length - 1);
    return matches[idx].name + " ";
  }

  /**
   * Tab-completion fallback. If the highlighted row already extends the
   * buffer, accept it; otherwise return the longest common prefix of
   * matches (or null if it would be a no-op).
   */
  complete(buffer: string): string | null {
    if (!this.shouldShow(buffer)) return null;
    const matches = this.filtered(buffer);
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0].name + " ";

    // Prefer the explicitly-selected row when the user has navigated.
    if (this.isVisible() && this.selectedIndex > 0) {
      return matches[this.selectedIndex].name + " ";
    }

    let prefix = matches[0].name;
    for (const c of matches) {
      while (!c.name.startsWith(prefix)) {
        prefix = prefix.slice(0, -1);
        if (!prefix) return null;
      }
    }
    return prefix.length > buffer.length ? prefix : null;
  }

  /**
   * Internal: draw the filtered list with the highlighted row marked.
   * Erases first (caller is responsible if they want to skip), redraws
   * each row, then walks the cursor back up to the prompt position.
   */
  private draw(
    matches: ReturnType<CommandMenu["filtered"]>,
    buffer: string,
  ): void {
    const term = this.term;
    const widest = matches.reduce(
      (n, c) => Math.max(n, c.name.length + (c.hint ? c.hint.length + 1 : 0)),
      0,
    );

    for (let i = 0; i < matches.length; i++) {
      const cmd = matches[i];
      const isSelected = i === this.selectedIndex;
      term.write("\r\n");
      term.write("\x1b[2K");

      const head = cmd.hint ? `${cmd.name} ${cmd.hint}` : cmd.name;
      const padded = head.padEnd(widest, " ");

      if (isSelected) {
        // Bright amber name + a `›` marker. Reverse-video would also work
        // but reads as too loud against the warm background.
        term.write(
          `${ANSI.amber}› ${ANSI.bold}${padded}${ANSI.reset}` +
            `${ANSI.text}  ${cmd.summary}${ANSI.reset}`,
        );
      } else {
        term.write(
          `${ANSI.dimText}  ${ANSI.amber}${padded}${ANSI.reset}` +
            `${ANSI.dimText}  ${cmd.summary}${ANSI.reset}`,
        );
      }
    }
    this.linesDrawn = matches.length;

    // Walk cursor back up to the prompt row, then to the buffer's column.
    term.write(`\x1b[${this.linesDrawn}A`);
    term.write("\r");
    const col = 2 + buffer.length; // 2 = visible width of `› ` prompt sigil
    if (col > 0) term.write(`\x1b[${col}C`);
  }
}
