"use client";

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";

export interface XTermHandle {
  write(data: string): void;
  writeln(data: string): void;
  clear(): void;
  focus(): void;
  cols(): number;
  rows(): number;
}

interface XTermWrapperProps {
  onData: (data: string) => void;
  /**
   * Fires exactly once, after xterm has been dynamically imported,
   * mounted, and `onData` has been wired. Use this to drive boot writes
   * (banner, welcome, prompt) instead of a setTimeout — async dynamic
   * imports can blow past any fixed delay on a cold cache.
   */
  onReady?: () => void;
}

/**
 * xterm.js theme aligned to DESIGN.md (warm OKLCH palette, CRT phosphor amber).
 * RGB values mirror the truecolor codes in lib/terminal/ansi.ts so the
 * default 16-color escapes match the SGR 38;2;R;G;B output exactly.
 */
const TERMINAL_THEME = {
  background: "#1a1612", // --bg-deep   oklch(0.11 0.01 70)
  foreground: "#e2dac8", // --text-primary
  cursor: "#e8a843", // --accent-amber (CRT phosphor)
  cursorAccent: "#1a1612",
  selectionBackground: "#332e29", // --border
  selectionForeground: "#e2dac8",

  black: "#0f0c0a",
  red: "#c14333",
  green: "#3fb874",
  yellow: "#e8a843",
  blue: "#3fb1bd",
  magenta: "#8a4aaa",
  cyan: "#3fb1bd",
  white: "#a89e8c",

  brightBlack: "#54493d", // --text-dim
  brightRed: "#d6594a",
  brightGreen: "#5fce8c",
  brightYellow: "#f4be5c",
  brightBlue: "#5fc8d2",
  brightMagenta: "#a163c2",
  brightCyan: "#5fc8d2",
  brightWhite: "#e2dac8",
} as const;

export const XTermWrapper = forwardRef<XTermHandle, XTermWrapperProps>(
  function XTermWrapper({ onData, onReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<any>(null);
    const fitAddonRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      write(data: string) {
        terminalRef.current?.write(data);
      },
      writeln(data: string) {
        terminalRef.current?.writeln(data);
      },
      clear() {
        terminalRef.current?.clear();
      },
      focus() {
        terminalRef.current?.focus();
      },
      cols() {
        return terminalRef.current?.cols ?? 80;
      },
      rows() {
        return terminalRef.current?.rows ?? 24;
      },
    }));

    const handleResize = useCallback(() => {
      try {
        fitAddonRef.current?.fit();
      } catch {
        // ignore fit errors during resize
      }
    }, []);

    useEffect(() => {
      if (!containerRef.current) return;

      let terminal: any;
      let fitAddon: any;
      let disposed = false;

      async function init() {
        const { Terminal } = await import("@xterm/xterm");
        const { FitAddon } = await import("@xterm/addon-fit");
        await import("@xterm/xterm/css/xterm.css");

        if (disposed) return;

        terminal = new Terminal({
          fontFamily:
            '"JetBrains Mono", "Fira Code", "Cascadia Code", "Menlo", monospace',
          fontSize: 13,
          fontWeight: "400",
          fontWeightBold: "700",
          letterSpacing: 0.2,
          lineHeight: 1.5,
          cursorBlink: true,
          cursorStyle: "block",
          cursorWidth: 2,
          scrollback: 5000,
          allowProposedApi: true,
          macOptionIsMeta: true,
          theme: TERMINAL_THEME,
        });

        fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);

        terminal.open(containerRef.current!);
        fitAddon.fit();

        terminal.onData(onData);

        terminalRef.current = terminal;
        fitAddonRef.current = fitAddon;

        window.addEventListener("resize", handleResize);
        terminal.focus();

        // Notify the shell that xterm is mounted and writable. This must
        // run *after* `terminalRef.current = terminal` so the imperative
        // handle's write/clear/focus are no longer no-ops.
        onReady?.();
      }

      init();

      return () => {
        disposed = true;
        window.removeEventListener("resize", handleResize);
        terminal?.dispose();
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <div
        ref={containerRef}
        // Background matches xterm theme so there's no visible seam at the
        // canvas edge. Padding follows the comfortable terminal density.
        style={{
          width: "100%",
          height: "100%",
          padding: "12px 16px",
          background: "#1a1612",
        }}
      />
    );
  }
);
