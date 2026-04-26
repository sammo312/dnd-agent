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
}

interface XTermWrapperProps {
  onData: (data: string) => void;
}

export const XTermWrapper = forwardRef<XTermHandle, XTermWrapperProps>(
  function XTermWrapper({ onData }, ref) {
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
          fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Menlo", monospace',
          fontSize: 14,
          lineHeight: 1.4,
          cursorBlink: true,
          cursorStyle: "block",
          scrollback: 5000,
          theme: {
            background: "#0a0e14",
            foreground: "#b3b1ad",
            cursor: "#e6b450",
            cursorAccent: "#0a0e14",
            selectionBackground: "#1a1f29",
            black: "#01060e",
            red: "#ea6c73",
            green: "#91b362",
            yellow: "#f9af4f",
            blue: "#53bdfa",
            magenta: "#c678dd",
            cyan: "#90e1c6",
            white: "#c7c7c7",
            brightBlack: "#686868",
            brightRed: "#f07178",
            brightGreen: "#c2d94c",
            brightYellow: "#ffb454",
            brightBlue: "#59c2ff",
            brightMagenta: "#d176e2",
            brightCyan: "#95e6cb",
            brightWhite: "#ffffff",
          },
        });

        fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);

        try {
          const { WebglAddon } = await import("@xterm/addon-webgl");
          const webglAddon = new WebglAddon();
          terminal.loadAddon(webglAddon);
        } catch {
          // WebGL not supported, canvas fallback is fine
        }

        terminal.open(containerRef.current!);
        fitAddon.fit();

        terminal.onData(onData);

        terminalRef.current = terminal;
        fitAddonRef.current = fitAddon;

        window.addEventListener("resize", handleResize);
        terminal.focus();
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
        style={{ width: "100%", height: "100%", padding: "8px" }}
      />
    );
  }
);
