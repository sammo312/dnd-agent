import { ANSI } from "./ansi";

/**
 * Inline ANSI multi-choice picker for xterm.
 *
 * Renders directly into the terminal — no DOM overlay. Same interaction
 * model as gum/fzf/Claude Code:
 *   - ↑/↓     navigate
 *   - 1..9    quick-pick
 *   - ↵       confirm
 *   - esc/^C  skip
 *
 * While a picker is active the host should swallow input from its normal
 * input-handler and forward keys via {@link Picker.handleKey}.
 */

export interface PickerOption {
  /** Stable value returned to the caller (e.g. tool result). */
  value: string;
  /** Display label shown in the option row. */
  label: string;
  /** Optional dim subtext shown after the label. */
  hint?: string;
}

export type PickerResult =
  | { cancelled: false; selected: number; value: string; label: string }
  | { cancelled: true };

export interface PickerHostTerminal {
  write(data: string): void;
}

interface PickerOptions {
  question: string;
  options: PickerOption[];
  description?: string;
}

export class Picker {
  private cursor = 0;
  private linesRendered = 0;
  private rendered = false;
  private done = false;
  private resolveFn: ((r: PickerResult) => void) | null = null;

  constructor(
    private readonly term: PickerHostTerminal,
    private readonly opts: PickerOptions,
  ) {
    if (opts.options.length === 0) {
      throw new Error("Picker needs at least one option");
    }
  }

  /**
   * Render the picker and resolve when the user confirms or cancels.
   * Caller should route raw keystrokes to {@link handleKey} until this
   * promise settles.
   */
  open(): Promise<PickerResult> {
    this.term.write(ANSI.hideCursor);
    this.draw();
    return new Promise((resolve) => {
      this.resolveFn = resolve;
    });
  }

  /**
   * Forward a raw xterm onData chunk. Returns true if the picker handled
   * it — the host should always treat that as "swallowed" while the
   * picker is open.
   */
  handleKey(data: string): boolean {
    if (this.done) return false;

    // ── Up ─────────────────────────────────────────
    if (data === "\x1b[A" || data === "\x1bOA" || data === "k") {
      this.cursor =
        (this.cursor - 1 + this.opts.options.length) % this.opts.options.length;
      this.draw();
      return true;
    }
    // ── Down ───────────────────────────────────────
    if (data === "\x1b[B" || data === "\x1bOB" || data === "j") {
      this.cursor = (this.cursor + 1) % this.opts.options.length;
      this.draw();
      return true;
    }
    // ── Quick-pick 1-9 ─────────────────────────────
    if (data.length === 1 && data >= "1" && data <= "9") {
      const idx = data.charCodeAt(0) - "1".charCodeAt(0);
      if (idx >= 0 && idx < this.opts.options.length) {
        this.cursor = idx;
        this.confirm();
      }
      return true;
    }
    // ── Confirm ────────────────────────────────────
    if (data === "\r" || data === "\n") {
      this.confirm();
      return true;
    }
    // ── Cancel ─────────────────────────────────────
    if (data === "\x1b" || data === "\x03" /* ^C */) {
      this.cancel();
      return true;
    }
    // Swallow everything else while picker is open.
    return true;
  }

  private draw(): void {
    if (this.rendered && this.linesRendered > 0) {
      // Move up to the top of the previous render and clear from there down.
      this.term.write(`\x1b[${this.linesRendered}A` + ANSI.clearScreenFromCursor);
    } else {
      // First render: drop one blank line so the picker doesn't sit on the prompt.
      this.term.write("\r\n");
    }

    let lines = 0;

    // Header
    this.term.write(
      `  ${ANSI.amber}?${ANSI.reset} ${ANSI.bold}${ANSI.text}${this.opts.question}${ANSI.reset}\r\n`,
    );
    lines++;

    if (this.opts.description) {
      this.term.write(
        `    ${ANSI.dimText}${this.opts.description}${ANSI.reset}\r\n`,
      );
      lines++;
    }

    // Options
    this.opts.options.forEach((opt, i) => {
      const selected = i === this.cursor;
      const marker = selected
        ? `${ANSI.amber}›${ANSI.reset}`
        : ` `;
      const numCol = `${ANSI.dimText}${i + 1}.${ANSI.reset}`;
      const label = selected
        ? `${ANSI.amber}${opt.label}${ANSI.reset}`
        : `${ANSI.text}${opt.label}${ANSI.reset}`;
      const hint = opt.hint
        ? `  ${ANSI.dimText}— ${opt.hint}${ANSI.reset}`
        : "";
      this.term.write(`  ${marker} ${numCol} ${label}${hint}\r\n`);
      lines++;
    });

    // Footer keymap
    this.term.write(
      `    ${ANSI.dimText}↑↓ navigate · ↵ select · 1-${Math.min(
        9,
        this.opts.options.length,
      )} pick · esc skip${ANSI.reset}\r\n`,
    );
    lines++;

    this.linesRendered = lines;
    this.rendered = true;
  }

  private confirm(): void {
    if (this.done) return;
    this.done = true;
    this.collapse();
    const opt = this.opts.options[this.cursor];
    this.term.write(
      `  ${ANSI.amber}?${ANSI.reset} ${ANSI.text}${this.opts.question}${ANSI.reset}  ${ANSI.dimText}→${ANSI.reset}  ${ANSI.amber}${opt.label}${ANSI.reset}\r\n`,
    );
    this.term.write(ANSI.showCursor);
    this.resolveFn?.({
      cancelled: false,
      selected: this.cursor,
      value: opt.value,
      label: opt.label,
    });
  }

  private cancel(): void {
    if (this.done) return;
    this.done = true;
    this.collapse();
    this.term.write(
      `  ${ANSI.amber}?${ANSI.reset} ${ANSI.text}${this.opts.question}${ANSI.reset}  ${ANSI.dimText}→ skipped${ANSI.reset}\r\n`,
    );
    this.term.write(ANSI.showCursor);
    this.resolveFn?.({ cancelled: true });
  }

  private collapse(): void {
    if (!this.rendered || this.linesRendered === 0) return;
    this.term.write(`\x1b[${this.linesRendered}A` + ANSI.clearScreenFromCursor);
  }
}
