"use client";

import { useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { XTermWrapper, type XTermHandle } from "./xterm-wrapper";
import { InputHandler } from "../lib/terminal/input-handler";
import { routeCommand as defaultRouteCommand } from "../lib/game/command-router";
import type { CommandResult } from "../lib/game/command-router";
import { BANNER } from "../lib/terminal/ascii-art";
import {
  formatNarration,
  formatPrompt,
  formatWelcome,
  formatSystemMessage,
  formatError,
  formatDiceRoll,
} from "../lib/terminal/output-formatter";
import { ANSI } from "../lib/terminal/ansi";

export interface TerminalConfig {
  /** API endpoint for chat. Default: "/api/chat" */
  apiEndpoint?: string;
  /** ASCII art banner displayed on startup. Default: DM CLI banner */
  banner?: string;
  /** Welcome message displayed after banner. Default: DM welcome */
  welcomeMessage?: () => string;
  /** Command router for slash commands. Default: DM command router */
  commandRouter?: (input: string) => CommandResult | null;
  /** Custom tool result renderer. Return formatted string to display, or null to fall back to defaults. */
  renderToolResult?: (toolName: string, result: unknown) => string | null;
}

export function TerminalShell({ config }: { config?: TerminalConfig } = {}) {
  const termRef = useRef<XTermHandle>(null);
  const inputHandler = useRef(new InputHandler()).current;
  const renderedRef = useRef<Map<string, number>>(new Map());
  const toolRenderedRef = useRef<Set<string>>(new Set());
  const isStreamingRef = useRef(false);
  const promptShownRef = useRef(false);

  const { messages, append, isLoading } = useChat({
    api: config?.apiEndpoint ?? "/api/chat",
    onError(error) {
      termRef.current?.write(formatError(error.message) + "\r\n");
      showPrompt();
    },
  });

  const showPrompt = useCallback(() => {
    if (!promptShownRef.current) {
      termRef.current?.write(formatPrompt());
      promptShownRef.current = true;
    }
  }, []);

  const redrawLine = useCallback(
    (line: string) => {
      const term = termRef.current;
      if (!term) return;
      term.write(ANSI.cursorToStart + ANSI.clearLine);
      term.write(`${ANSI.system}> ${ANSI.input}${line}`);
    },
    []
  );

  const sendToAI = useCallback(
    (text: string) => {
      isStreamingRef.current = true;
      append({ role: "user", content: text });
    },
    [append]
  );

  const handleData = useCallback(
    (data: string) => {
      const term = termRef.current;
      if (!term) return;

      if (isLoading) {
        if (data === "\x03") {
          // Allow Ctrl+C to interrupt
        }
        return;
      }

      const event = inputHandler.processKey(data);
      if (!event) return;

      switch (event.type) {
        case "char":
          term.write(event.char);
          break;

        case "backspace":
          term.write("\b \b");
          break;

        case "submit": {
          term.write("\r\n");
          promptShownRef.current = false;

          if (event.line.length === 0) {
            showPrompt();
            return;
          }

          const cmdResult = (config?.commandRouter ?? defaultRouteCommand)(event.line);
          if (cmdResult) {
            term.write(cmdResult.output);
            if (cmdResult.sendToAI && cmdResult.aiMessage) {
              sendToAI(cmdResult.aiMessage);
            } else {
              showPrompt();
            }
          } else {
            sendToAI(event.line);
          }
          break;
        }

        case "history-prev":
        case "history-next":
          redrawLine(event.line);
          break;

        case "interrupt":
          term.write("^C\r\n");
          showPrompt();
          break;

        case "tab":
          break;
      }
    },
    [isLoading, inputHandler, showPrompt, sendToAI, redrawLine]
  );

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return;

    const parts = lastMessage.parts ?? [];

    for (const part of parts) {
      if (part.type === "text") {
        const partId = `${lastMessage.id}-text-${parts.indexOf(part)}`;
        const alreadyRendered = renderedRef.current.get(partId) ?? 0;
        const newText = part.text.slice(alreadyRendered);

        if (newText) {
          const termText = formatNarration(newText).replace(/\n/g, "\r\n");
          term.write(termText);
          renderedRef.current.set(partId, part.text.length);
        }
      } else if (part.type === "tool-invocation") {
        const toolId = `${lastMessage.id}-tool-${part.toolInvocation.toolCallId}`;

        if (part.toolInvocation.state === "result" && !toolRenderedRef.current.has(toolId)) {
          toolRenderedRef.current.add(toolId);

          const { toolName, result } = part.toolInvocation;

          // Try custom renderer first, fall back to built-in DM rendering
          const customOutput = config?.renderToolResult?.(toolName, result);
          if (customOutput != null) {
            term.write(customOutput);
          } else if (toolName === "rollDice" && result) {
            const r = result as { notation: string; rolls: number[]; modifier: number; total: number; reason?: string };
            term.write(formatDiceRoll(r.notation, r.rolls, r.modifier, r.total, r.reason));
          } else if (toolName === "generateName" && result) {
            const r = result as { type: string; names: string[] };
            term.write(formatSystemMessage(`Generated: ${r.names.join(", ")}`) + "\r\n");
          }
        }
      }
    }
  }, [messages]);

  useEffect(() => {
    if (!isLoading && isStreamingRef.current) {
      isStreamingRef.current = false;
      showPrompt();
    }
  }, [isLoading, showPrompt]);

  const startupDone = useRef(false);
  useEffect(() => {
    if (startupDone.current) return;
    startupDone.current = true;

    const timer = setTimeout(() => {
      const term = termRef.current;
      if (!term) return;
      term.write(config?.banner ?? BANNER);
      term.write(config?.welcomeMessage?.() ?? formatWelcome());
      showPrompt();
    }, 200);

    return () => clearTimeout(timer);
  }, [showPrompt]);

  return <XTermWrapper ref={termRef} onData={handleData} />;
}
