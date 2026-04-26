"use client";

import { useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { useStoryStore } from "@dnd-agent/narrative-editor";
import type {
  Section,
  DialogueNode,
  StoryNode,
} from "@dnd-agent/narrative-editor";
import { useMapStore } from "@dnd-agent/map-editor";
import { useDmContextStore } from "../lib/dm-context-store";
import { XTermWrapper, type XTermHandle } from "./xterm-wrapper";
import { InputHandler } from "../lib/terminal/input-handler";
import {
  routeCommand as defaultRouteCommand,
  type CommandContext,
} from "../lib/game/command-router";
import type { CommandResult } from "../lib/game/command-router";
import { BANNER } from "../lib/terminal/ascii-art";
import {
  formatNarration,
  formatPrompt,
  formatWelcome,
  formatError,
  formatDiceRoll,
  formatToolCall,
  formatStatus,
} from "../lib/terminal/output-formatter";
import { ANSI } from "../lib/terminal/ansi";
import { Picker, type PickerResult } from "../lib/terminal/picker";
import { formatLinkCard, type LinkSurface } from "../lib/terminal/link-card";

export interface TerminalConfig {
  /** API endpoint for chat. Default: "/api/chat" */
  apiEndpoint?: string;
  /** ASCII art banner displayed on startup. Default: dm.prep banner */
  banner?: string;
  /** Welcome message displayed after banner. */
  welcomeMessage?: () => string;
  /** Command router for slash commands. */
  commandRouter?: (input: string, ctx?: CommandContext) => CommandResult | null;
  /** Custom tool result renderer. Return formatted string to display, or null to fall back to defaults. */
  renderToolResult?: (toolName: string, result: unknown) => string | null;
}

export interface TerminalShellProps {
  config?: TerminalConfig;
  /**
   * Called when the user (or a slash command) wants to focus a workspace
   * surface. The host (workbench) wires this to Dockview to bring the
   * matching panel forward.
   */
  onOpenSurface?: (surface: LinkSurface) => void;
}

/**
 * Build a snapshot of the workspace to ship to the DM agent on each turn.
 * Pulls live state from the cross-package zustand stores so the agent
 * always sees the current map, scene context, characters, and story
 * structure — plus the autoMode flag so the prompt can switch behavior.
 */
function buildWorkspaceSnapshot() {
  const dm = useDmContextStore.getState();
  const story = useStoryStore.getState();
  const mapSnap = useMapStore.getState().snapshot;

  const sectionStoreNodes = story.nodes.filter((n) => n.type === "section");
  const dialogueStoreNodes = story.nodes.filter((n) => n.type === "dialogue");

  const chapters = sectionStoreNodes.map((s) => {
    const sectionData = s.data as Section;
    const reachable: string[] = [];
    const visited = new Set<string>();
    const queue: string[] = [];
    if (sectionData.start_id) queue.push(sectionData.start_id);
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (!id || visited.has(id)) continue;
      visited.add(id);
      const node = story.nodes.find((n) => n.id === id);
      if (!node || node.type !== "dialogue") continue;
      reachable.push(id);
      const data = node.data as DialogueNode;
      for (const c of data.choices) queue.push(c.id);
    }
    return {
      name: sectionData.name,
      title: sectionData.title,
      nodeIds: reachable,
    };
  });

  return {
    scene: dm.scene,
    characters: dm.characters.map((c) => ({
      name: c.name,
      role: c.role,
      description: c.description,
    })),
    story: {
      chapters,
      totalDialogueNodes: dialogueStoreNodes.length,
    },
    map: mapSnap,
    autoMode: dm.autoMode,
  };
}

/** Short single-line label for the terminal output when a tool is invoked. */
function describeToolCall(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case "setSceneContext":
      return `scene · ${args.title}`;
    case "addCharacter":
      return `character · ${args.name} (${args.role})`;
    case "createChapter":
      return `chapter · ${args.name}`;
    case "addDialogueNode":
      return `node · ${args.chapterName}/${args.nodeId}`;
    case "setMapDimensions":
      return `map · ${args.width}×${args.height}${args.reset ? " (reset)" : ""}`;
    case "paintTerrain":
      return `paint · ${args.terrain} (${args.x1},${args.y1})→(${args.x2},${args.y2})`;
    case "addPOI":
      return `poi · ${args.name} @ ${args.x},${args.y}`;
    case "rollDice":
      return `roll · ${args.notation}${args.reason ? ` (${args.reason})` : ""}`;
    case "askQuestion":
      return `ask · ${args.question}`;
    case "linkToSurface":
      return `link · ${args.surface}`;
    default:
      return toolName;
  }
}

export function TerminalShell({
  config,
  onOpenSurface,
}: TerminalShellProps = {}) {
  const termRef = useRef<XTermHandle>(null);
  const inputHandler = useRef(new InputHandler()).current;
  const renderedRef = useRef<Map<string, number>>(new Map());
  const toolCallRenderedRef = useRef<Set<string>>(new Set());
  const toolResultRenderedRef = useRef<Set<string>>(new Set());
  const isStreamingRef = useRef(false);
  const promptShownRef = useRef(false);
  const pickerRef = useRef<Picker | null>(null);

  const showPrompt = useCallback(() => {
    if (!promptShownRef.current && !pickerRef.current) {
      termRef.current?.write(formatPrompt());
      promptShownRef.current = true;
    }
  }, []);

  /**
   * Apply a prep tool call to the right zustand store and return a result
   * to the agent. Inline so it can close over `termRef` + `pickerRef` to
   * drive the picker for askQuestion and the link card for linkToSurface.
   */
  const handlePrepToolCall = useCallback(
    async (
      toolName: string,
      args: Record<string, unknown>,
    ): Promise<unknown> => {
      const story = useStoryStore.getState();
      const dm = useDmContextStore.getState();
      const mapStore = useMapStore.getState();
      const term = termRef.current;

      switch (toolName) {
        case "setSceneContext": {
          dm.setScene({
            title: String(args.title ?? ""),
            pitch: String(args.pitch ?? ""),
            summary: String(args.summary ?? ""),
            tone: args.tone ? String(args.tone) : undefined,
            setting: args.setting ? String(args.setting) : undefined,
          });
          return { ok: true, saved: "scene" };
        }

        case "addCharacter": {
          const id = `char-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          dm.addCharacter({
            id,
            name: String(args.name ?? "Unnamed"),
            role: (args.role as "pc" | "npc" | "antagonist") ?? "npc",
            description: String(args.description ?? ""),
            motivation: args.motivation ? String(args.motivation) : undefined,
          });
          return { ok: true, characterId: id };
        }

        case "createChapter": {
          const name = String(args.name ?? "");
          if (!name) return { ok: false, error: "Chapter name required." };
          const existing = story.nodes.find(
            (n) => n.type === "section" && (n.data as Section).name === name,
          );
          if (existing) {
            return {
              ok: false,
              error: `Chapter "${name}" already exists. Use addDialogueNode to add to it.`,
            };
          }
          const sectionCount = story.nodes.filter((n) => n.type === "section").length;
          const id = `section_${name}`;
          story.addNode({
            id,
            type: "section",
            position: { x: 100, y: 100 + sectionCount * 380 },
            data: {
              id: name,
              name,
              title: String(args.title ?? name),
              start_id: "",
            } as Section,
          });
          return { ok: true, chapterId: id };
        }

        case "addDialogueNode": {
          const chapterName = String(args.chapterName ?? "");
          const nodeId = String(args.nodeId ?? "");
          const speaker = String(args.speaker ?? "Narrator");
          const lines = (args.lines as string[]) ?? [];
          const choices =
            (args.choices as { label: string; targetNodeId: string }[]) ?? [];

          const sectionStoreNode = story.nodes.find(
            (n) =>
              n.type === "section" && (n.data as Section).name === chapterName,
          );
          if (!sectionStoreNode) {
            return {
              ok: false,
              error: `Chapter "${chapterName}" not found. Call createChapter first.`,
            };
          }
          const sectionData = sectionStoreNode.data as Section;

          const sectionIndex = story.nodes
            .filter((n) => n.type === "section")
            .indexOf(sectionStoreNode);
          const dialogueCount = story.nodes.filter((n) => n.type === "dialogue").length;

          const nodeData: DialogueNode = {
            id: nodeId,
            speaker,
            dialogue: lines.map((t) => ({ text: t, speed: 70 })),
            choices: choices.map((c) => ({ label: c.label, id: c.targetNodeId })),
          };

          const existing = story.nodes.find(
            (n) => n.id === nodeId && n.type === "dialogue",
          );
          if (existing) {
            story.updateNode(nodeId, nodeData as Partial<DialogueNode>);
          } else {
            const newNode: StoryNode = {
              id: nodeId,
              type: "dialogue",
              position: {
                x: 450 + (dialogueCount % 4) * 320,
                y: 100 + sectionIndex * 380 + Math.floor(dialogueCount / 4) * 200,
              },
              data: nodeData,
            };
            story.addNode(newNode);
          }

          const explicitStart = args.isStart === true;
          const noStartYet = !sectionData.start_id;
          const shouldBeStart = explicitStart || noStartYet;

          if (shouldBeStart) {
            story.updateNode(sectionStoreNode.id, {
              start_id: nodeId,
            } as Partial<Section>);
            const connId = `conn_${sectionStoreNode.id}_${nodeId}`;
            const exists = story.connections.some((c) => c.id === connId);
            if (!exists) {
              story.addConnection({
                id: connId,
                from: sectionStoreNode.id,
                to: nodeId,
                label: "starts",
              });
            }
          }

          for (const c of choices) {
            const targetExists = useStoryStore
              .getState()
              .nodes.some((n) => n.id === c.targetNodeId);
            if (!targetExists) {
              const stubCount = useStoryStore
                .getState()
                .nodes.filter((n) => n.type === "dialogue").length;
              useStoryStore.getState().addNode({
                id: c.targetNodeId,
                type: "dialogue",
                position: {
                  x: 450 + (stubCount % 4) * 320,
                  y:
                    100 +
                    sectionIndex * 380 +
                    Math.floor(stubCount / 4) * 200,
                },
                data: {
                  id: c.targetNodeId,
                  speaker: "Narrator",
                  dialogue: [{ text: "(stub — fill me in)", speed: 70 }],
                  choices: [],
                } as DialogueNode,
              });
            }
            const connId = `conn_${nodeId}_${c.targetNodeId}_${c.label}`.replace(
              /\s+/g,
              "_",
            );
            const connExists = useStoryStore
              .getState()
              .connections.some(
                (con) =>
                  con.from === nodeId &&
                  con.to === c.targetNodeId &&
                  con.label === c.label,
              );
            if (!connExists) {
              useStoryStore.getState().addConnection({
                id: connId,
                from: nodeId,
                to: c.targetNodeId,
                label: c.label,
              });
            }
          }

          return { ok: true, nodeId, isStart: shouldBeStart };
        }

        case "setMapDimensions": {
          mapStore.enqueueMutation({
            type: "set_dimensions",
            width: Number(args.width),
            height: Number(args.height),
            reset: Boolean(args.reset),
          });
          return { ok: true };
        }

        case "paintTerrain": {
          mapStore.enqueueMutation({
            type: "paint_rect",
            terrain: String(args.terrain),
            x1: Number(args.x1),
            y1: Number(args.y1),
            x2: Number(args.x2),
            y2: Number(args.y2),
          });
          return { ok: true };
        }

        case "addPOI": {
          mapStore.enqueueMutation({
            type: "add_poi",
            poiType: String(args.poiType),
            name: String(args.name),
            x: Number(args.x),
            y: Number(args.y),
          });
          return { ok: true };
        }

        case "askQuestion": {
          if (!term) return { cancelled: true };
          // Tear down the prompt line if showing — picker draws fresh.
          if (promptShownRef.current) {
            term.write(ANSI.cursorToStart + ANSI.clearLine);
            promptShownRef.current = false;
          }
          const choices = (args.choices as Array<{
            value: string;
            label: string;
            hint?: string;
          }>) ?? [];
          if (choices.length === 0) {
            return { cancelled: true, error: "No choices provided" };
          }
          const picker = new Picker(term, {
            question: String(args.question ?? ""),
            description: args.description ? String(args.description) : undefined,
            options: choices,
          });
          pickerRef.current = picker;
          let result: PickerResult;
          try {
            result = await picker.open();
          } finally {
            pickerRef.current = null;
          }
          return result.cancelled
            ? { cancelled: true }
            : {
                cancelled: false,
                value: result.value,
                label: result.label,
              };
        }

        case "linkToSurface": {
          if (term) {
            term.write(
              formatLinkCard({
                surface: args.surface as LinkSurface,
                title: String(args.title ?? "updated"),
                summary: String(args.summary ?? ""),
              }),
            );
          }
          return { ok: true };
        }

        default:
          return { ok: false, error: `Unknown tool: ${toolName}` };
      }
    },
    [],
  );

  const { messages, append, isLoading } = useChat({
    api: config?.apiEndpoint ?? "/api/chat",
    maxSteps: 16,
    experimental_prepareRequestBody: ({ messages }) => ({
      messages,
      workspace: buildWorkspaceSnapshot(),
    }),
    async onToolCall({ toolCall }) {
      try {
        const result = await handlePrepToolCall(
          toolCall.toolName,
          (toolCall.args ?? {}) as Record<string, unknown>,
        );
        return result;
      } catch (err) {
        console.log("[v0] onToolCall error:", err);
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
    onError(error) {
      termRef.current?.write(formatError(error.message) + "\r\n");
      showPrompt();
    },
  });

  const redrawLine = useCallback((line: string) => {
    const term = termRef.current;
    if (!term) return;
    term.write(ANSI.cursorToStart + ANSI.clearLine);
    term.write(`${ANSI.amber}›${ANSI.reset} ${ANSI.input}${line}`);
  }, []);

  const sendToAI = useCallback(
    (text: string) => {
      isStreamingRef.current = true;
      append({ role: "user", content: text });
    },
    [append],
  );

  /**
   * Slash-command context — gives commands a way to mutate the store
   * (auto mode) and focus other panels (map / story).
   */
  const commandContext = useRef<CommandContext>({
    toggleAutoMode: () => useDmContextStore.getState().toggleAutoMode(),
    setAutoMode: (enabled: boolean) => {
      useDmContextStore.getState().setAutoMode(enabled);
      return enabled;
    },
    openSurface: (surface) => onOpenSurface?.(surface),
  }).current;

  // Keep openSurface fresh if the prop changes between renders.
  useEffect(() => {
    commandContext.openSurface = (surface) => onOpenSurface?.(surface);
  }, [onOpenSurface, commandContext]);

  const handleData = useCallback(
    (data: string) => {
      const term = termRef.current;
      if (!term) return;

      // Picker takes priority over everything — including the loading
      // gate — so the DM can answer while the agent is still streaming.
      if (pickerRef.current) {
        pickerRef.current.handleKey(data);
        return;
      }

      if (isLoading) {
        // Allow Ctrl+C to interrupt later — for now silently swallow.
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

          const router = config?.commandRouter ?? defaultRouteCommand;
          const cmdResult = router(event.line, commandContext);
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
    [isLoading, inputHandler, showPrompt, sendToAI, redrawLine, config, commandContext],
  );

  // Render streamed assistant output: text deltas + tool call labels + tool results.
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return;

    const parts = lastMessage.parts ?? [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.type === "text") {
        const partId = `${lastMessage.id}-text-${i}`;
        const alreadyRendered = renderedRef.current.get(partId) ?? 0;
        const newText = part.text.slice(alreadyRendered);

        if (newText) {
          const termText = formatNarration(newText).replace(/\n/g, "\r\n");
          term.write(termText);
          renderedRef.current.set(partId, part.text.length);
        }
      } else if (part.type === "tool-invocation") {
        const inv = part.toolInvocation;
        const callKey = `${lastMessage.id}-tool-call-${inv.toolCallId}`;
        const resultKey = `${lastMessage.id}-tool-result-${inv.toolCallId}`;

        // Decide whether to print a quiet breadcrumb. Skip askQuestion and
        // linkToSurface — they render their own UI (picker / card) so a
        // breadcrumb above them is redundant and noisy.
        const shouldShowBreadcrumb =
          inv.toolName !== "askQuestion" && inv.toolName !== "linkToSurface";

        if (
          shouldShowBreadcrumb &&
          (inv.state === "call" || inv.state === "result") &&
          !toolCallRenderedRef.current.has(callKey)
        ) {
          toolCallRenderedRef.current.add(callKey);
          const label = describeToolCall(
            inv.toolName,
            (inv.args ?? {}) as Record<string, unknown>,
          );
          term.write("\r\n" + formatToolCall(label));
        }

        if (
          inv.state === "result" &&
          !toolResultRenderedRef.current.has(resultKey)
        ) {
          toolResultRenderedRef.current.add(resultKey);

          const customOutput = config?.renderToolResult?.(
            inv.toolName,
            inv.result,
          );
          if (customOutput != null) {
            term.write(customOutput);
          } else if (inv.toolName === "rollDice" && inv.result) {
            const r = inv.result as {
              notation: string;
              rolls: number[];
              modifier: number;
              total: number;
              reason?: string;
            };
            term.write(
              formatDiceRoll(r.notation, r.rolls, r.modifier, r.total, r.reason),
            );
          } else if (
            inv.result &&
            typeof inv.result === "object" &&
            "ok" in inv.result &&
            (inv.result as { ok: boolean }).ok === false
          ) {
            const r = inv.result as { error?: string };
            term.write(
              formatError(r.error ?? `${inv.toolName} failed`) + "\r\n",
            );
          }
          // Successful prep-tool results: no extra output (the breadcrumb is enough).
        }
      }
    }
  }, [messages, config]);

  useEffect(() => {
    if (!isLoading && isStreamingRef.current && !pickerRef.current) {
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
      const auto = useDmContextStore.getState().autoMode;
      if (auto) {
        term.write(formatStatus("auto mode is on"));
      }
      showPrompt();
    }, 200);

    return () => clearTimeout(timer);
  }, [showPrompt, config]);

  // Send a synthetic kickoff message so the agent introduces itself
  // and starts the interview when the workspace is empty.
  const kickoffSent = useRef(false);
  useEffect(() => {
    if (kickoffSent.current) return;
    if (messages.length > 0) {
      kickoffSent.current = true;
      return;
    }
    const t = setTimeout(() => {
      if (kickoffSent.current) return;
      kickoffSent.current = true;
      sendToAI("Hello — I'm ready to start prepping a scene.");
    }, 500);
    return () => clearTimeout(t);
  }, [messages.length, sendToAI]);

  return <XTermWrapper ref={termRef} onData={handleData} />;
}
