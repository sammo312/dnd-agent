import { ANSI } from "./ansi";

/**
 * Animated "thinking…" spinner that occupies its own line in the
 * terminal. Solves the "agent looks hung" problem during the silent
 * gaps between (a) the user submitting and the first stream chunk
 * arriving and (b) a tool result returning and the model deciding
 * what to do next. Both gaps can be 5-15s when the planner tool
 * fires (Sonnet TTFT + generation), and during that time nothing
 * else moves on screen.
 *
 * The indicator self-manages: a 350ms grace delay before first paint
 * so fast responses don't flicker a one-frame spinner, then a 10-
 * frame braille glyph cycling at 80ms/frame. Calling `start()` while
 * already running is a no-op; `stop()` cleans up the line and clears
 * the timer.
 *
 * Render-time invariant: the indicator only ever occupies the line
 * the cursor was on when `start()` was called. It uses `\r` + clear-
 * line on each frame, so subsequent writes after `stop()` land
 * cleanly on a fresh line below.
 */

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const FRAME_INTERVAL_MS = 80;
const SHOW_DELAY_MS = 350;

export interface ThinkingIndicator {
  start: (label?: string) => void;
  stop: () => void;
  isActive: () => boolean;
}

interface TerminalLike {
  write: (data: string) => void;
}

export function createThinkingIndicator(
  termRef: { current: TerminalLike | null },
): ThinkingIndicator {
  let frameIndex = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let showTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let painted = false;
  let currentLabel = "thinking";

  const paintFrame = () => {
    const term = termRef.current;
    if (!term) return;
    const glyph = FRAMES[frameIndex % FRAMES.length];
    // \r + clearLine erases whatever the previous frame painted on
    // this line; the spinner stays anchored to the line `start()` was
    // called on. The leading newline only fires on the first paint
    // so the indicator doesn't overwrite the user's prompt line.
    const prefix = painted ? "" : "\r\n";
    term.write(
      `${prefix}\r${ANSI.clearLine}${ANSI.dimText}${glyph} ${currentLabel}…${ANSI.reset}`,
    );
    painted = true;
    frameIndex += 1;
  };

  const start = (label?: string) => {
    // Already running — just refresh the label so callers can swap
    // "thinking" → "designing scene" mid-cycle without restarting.
    if (intervalId !== null || showTimeoutId !== null) {
      if (label) currentLabel = label;
      return;
    }
    if (label) currentLabel = label;
    frameIndex = 0;
    painted = false;

    // Defer the first paint by SHOW_DELAY_MS so quick responses (where
    // the first chunk lands in <200ms) never paint a spinner at all.
    showTimeoutId = setTimeout(() => {
      showTimeoutId = null;
      paintFrame();
      intervalId = setInterval(paintFrame, FRAME_INTERVAL_MS);
    }, SHOW_DELAY_MS);
  };

  const stop = () => {
    if (showTimeoutId !== null) {
      clearTimeout(showTimeoutId);
      showTimeoutId = null;
    }
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (painted) {
      const term = termRef.current;
      // Erase the spinner line so the next write lands on a clean
      // line. Don't emit a trailing newline — the messages effect
      // and re-prompt logic supply their own line breaks.
      term?.write(`\r${ANSI.clearLine}`);
    }
    painted = false;
  };

  const isActive = () => intervalId !== null || showTimeoutId !== null;

  return { start, stop, isActive };
}
