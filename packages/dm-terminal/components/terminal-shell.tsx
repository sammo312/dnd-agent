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
  type ExportSummary,
} from "../lib/game/command-router";
import type { CommandResult } from "../lib/game/command-router";
import { runProjectExport } from "../lib/export/run-export";
import {
  formatNarration,
  formatPrompt,
  formatPromptInline,
  formatWelcome,
  formatError,
  formatDiceRoll,
  formatToolCall,
} from "../lib/terminal/output-formatter";
import { ANSI } from "../lib/terminal/ansi";
import { Picker, type PickerResult } from "../lib/terminal/picker";
import { formatLinkCard, type LinkSurface } from "../lib/terminal/link-card";
import { CommandMenu } from "../lib/terminal/command-menu";
import {
  createThinkingIndicator,
  type ThinkingIndicator,
} from "../lib/terminal/thinking-indicator";

/**
 * Tools whose `execute` runs on the API route, not in the client. The
 * AI SDK still fires useChat's `onToolCall` for these (it doesn't know
 * the difference), so we short-circuit them in the client dispatcher
 * to avoid the "Unknown tool" path racing the real server result.
 *
 * Keep this in sync with `dmTools` (any tool defined with an `execute`
 * function in lib/ai/tools/).
 */
const SERVER_SIDE_TOOL_NAMES = new Set<string>([
  "rollDice",
  "planNarrative",
]);

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

/**
 * The same shape `useChat`'s onToolCall handler returns. Hosts that wire
 * this up (e.g. the workbench's MCP bridge) get a stable function that,
 * given a tool name + args, will execute it as if the in-app DM emitted
 * it — applying the mutation to the same stores and returning the same
 * structured result.
 */
export type PrepDispatch = (
  toolName: string,
  args: Record<string, unknown>,
) => Promise<unknown>;

export interface TerminalShellProps {
  config?: TerminalConfig;
  /**
   * Called when the user (or a slash command) wants to focus a workspace
   * surface. The host (workbench) wires this to Dockview to bring the
   * matching panel forward.
   */
  onOpenSurface?: (surface: LinkSurface) => void;
  /**
   * Fires once after the shell has built its tool dispatcher. The host
   * can hold onto the dispatch function and use it to drive the same
   * tool surface from outside the chat (e.g. an MCP bridge). The
   * dispatcher is stable — safe to stash by reference.
   */
  onPrepDispatchReady?: (dispatch: PrepDispatch) => void;
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
      kind: sectionData.kind ?? "beat",
      nodeIds: reachable,
    };
  });

  const hasPreface = chapters.some((c) => c.kind === "preface");

  return {
    scene: dm.scene,
    characters: dm.characters.map((c) => ({
      name: c.name,
      role: c.role,
      description: c.description,
    })),
    story: {
      chapters,
      hasPreface,
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
    case "createChapter": {
      const k = args.kind ? ` (${args.kind})` : "";
      return `section · ${args.name}${k}`;
    }
    case "addDialogueNode":
      return `node · ${args.chapterName}/${args.nodeId}`;
    case "setMapDimensions":
      return `map · ${args.width}×${args.height}${args.reset ? " (reset)" : ""}`;
    case "paintTerrain":
      return `paint · ${args.terrain} (${args.x1},${args.y1})→(${args.x2},${args.y2})`;
    case "addPOI":
      return `poi · ${args.name} @ ${args.x},${args.y}`;
    case "setSpawn":
      return `spawn · @ ${args.x},${args.y}`;
    case "placeBeat":
      return `beat · ${args.sectionName} @ ${args.x},${args.y}`;
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
  onPrepDispatchReady,
}: TerminalShellProps = {}) {
  const termRef = useRef<XTermHandle>(null);
  const inputHandler = useRef(new InputHandler()).current;
  const renderedRef = useRef<Map<string, number>>(new Map());
  const toolCallRenderedRef = useRef<Set<string>>(new Set());
  const toolResultRenderedRef = useRef<Set<string>>(new Set());
  const isStreamingRef = useRef(false);
  const promptShownRef = useRef(false);
  const pickerRef = useRef<Picker | null>(null);
  const commandMenuRef = useRef<CommandMenu | null>(null);
  // Animated "thinking…" spinner — shown during the silent gaps
  // between user-submit and first stream chunk, and between a tool
  // result and the model deciding what to do next. Both gaps can
  // run 5-15s when the planner tool fires and used to look like a
  // hung agent.
  //
  // Init in a mount effect rather than at render-time so React's
  // strict-mode double-invoke doesn't leave a stray timer on a torn-
  // down indicator. Callers always go through `?.start/.stop`, so a
  // null indicator on the very first render is a no-op (and there's
  // nothing to spin over yet anyway — no message has streamed).
  const thinkingRef = useRef<ThinkingIndicator | null>(null);
  useEffect(() => {
    thinkingRef.current = createThinkingIndicator(termRef);
    return () => {
      thinkingRef.current?.stop();
      thinkingRef.current = null;
    };
  }, []);

  const showPrompt = useCallback(() => {
    if (!promptShownRef.current && !pickerRef.current) {
      const auto = useDmContextStore.getState().autoMode;
      termRef.current?.write(formatPrompt(auto));
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
      // Server-side tools (rollDice, planNarrative) run on the API
      // route via their `execute` functions. The AI SDK still invokes
      // useChat's `onToolCall` for them on the client, but we have no
      // business handling them here — returning undefined lets the
      // server's streamed result win the race instead of our default
      // branch returning a bogus "Unknown tool" error that the model
      // then sees as the tool result. (This is the source of the
      // "Error: Unknown tool: planNarrative" line in the transcript.)
      if (SERVER_SIDE_TOOL_NAMES.has(toolName)) {
        return undefined;
      }

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
          if (!name) return { ok: false, error: "Section name required." };
          const requestedKind = (args.kind as "preface" | "beat" | undefined) ?? "beat";
          const existing = story.nodes.find(
            (n) => n.type === "section" && (n.data as Section).name === name,
          );
          // Idempotent: if a section with the same name *and* kind
          // already exists, return success pointing at the existing
          // section. The executor model frequently retries `createChapter`
          // on cross-turn builds (auto mode, big maps) and the previous
          // hard-error wasted 3-5 tool calls per turn, which compounded
          // into rate-limit failures. Only error when there's a real
          // conflict (same name, different kind).
          if (existing) {
            const existingData = existing.data as Section;
            if (existingData.kind === requestedKind) {
              return {
                ok: true,
                chapterId: existing.id,
                kind: existingData.kind,
                alreadyExisted: true,
              };
            }
            return {
              ok: false,
              error: `Section "${name}" already exists with kind "${existingData.kind}", but you asked for "${requestedKind}". Pick a different name or use the existing section via addDialogueNode.`,
            };
          }
          if (requestedKind === "preface") {
            // The "only one preface per project" invariant is real and
            // worth keeping — but if the executor is asking for a
            // *named* preface and one of a different name exists, the
            // existing-name branch above already covered the same-name
            // case. So this only fires when the names differ.
            const prefaceExists = story.nodes.some(
              (n) =>
                n.type === "section" &&
                (n.data as Section).kind === "preface",
            );
            if (prefaceExists) {
              return {
                ok: false,
                error:
                  "A preface section already exists. Only one preface is allowed per project — create this as kind:'beat' instead.",
              };
            }
          }
          const sectionCount = story.nodes.filter((n) => n.type === "section").length;
          const id = `section_${name}`;
          // Deterministic placeholder id keyed off the section name so
          // `addDialogueNode` can recognize and replace it later when
          // the agent adds the section's first real node.
          const placeholderId = `${name}__placeholder`;
          story.addNode({
            id,
            type: "section",
            position: { x: 100, y: 100 + sectionCount * 380 },
            data: {
              id: name,
              name,
              title: String(args.title ?? name),
              // Will be overwritten to `placeholderId` by the
              // `addConnection` call below — the store's section→dialogue
              // edge auto-populates the section's start_id.
              start_id: "",
              kind: requestedKind,
            } as Section,
          });
          // Seed a placeholder dialogue node + connection so the section
          // is exportable from the moment of creation. Without this, an
          // agent that creates the section and then runs out of tool
          // budget (rate limit, hit max steps, user interrupt) leaves
          // the project in a malformed state where export blocks on
          // "Section X has no start node." With it, the worst case is
          // a clearly-labeled placeholder line in the editor — visible,
          // non-blocking, easy for the user to fill in.
          story.addNode({
            id: placeholderId,
            type: "dialogue",
            position: { x: 450, y: 100 + sectionCount * 380 },
            data: {
              id: placeholderId,
              speaker: "Narrator",
              dialogue: [
                {
                  text: "(empty section — replace with your opening line)",
                  speed: 60,
                },
              ],
              choices: [],
            } as DialogueNode,
          });
          story.addConnection({
            id: `conn_${id}_${placeholderId}`,
            from: id,
            to: placeholderId,
            label: "starts",
          });
          return { ok: true, chapterId: id, kind: requestedKind };
        }

        case "addDialogueNode": {
          const chapterName = String(args.chapterName ?? "");
          const nodeId = String(args.nodeId ?? "");
          const speaker = String(args.speaker ?? "Narrator");
          const segmentsArg = args.segments as
            | { text: string; pace?: string; color?: string }[]
            | undefined;
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

          // Map agent-friendly pace labels and color names to the
          // story-store's per-character ms speed and hex colors.
          const PACE_MS: Record<string, number> = {
            excited: 30,
            neutral: 60,
            thoughtful: 115,
            hesitant: 200,
            pause: 400,
          };
          const COLOR_HEX: Record<string, string> = {
            red: "#ff5555",
            green: "#55ff55",
            blue: "#5555ff",
            yellow: "#ffff55",
            magenta: "#ff55ff",
            cyan: "#55ffff",
            white: "#ffffff",
          };

          const dialogueSegments =
            segmentsArg && segmentsArg.length > 0
              ? segmentsArg.map((s) => {
                  const speed =
                    s.pace && PACE_MS[s.pace] !== undefined
                      ? PACE_MS[s.pace]
                      : 60;
                  const color =
                    s.color && COLOR_HEX[s.color] ? COLOR_HEX[s.color] : undefined;
                  return {
                    text: String(s.text ?? ""),
                    speed,
                    style: color ? { color } : undefined,
                  };
                })
              : lines.map((t) => ({ text: t, speed: 60 }));

          const nodeData: DialogueNode = {
            id: nodeId,
            speaker,
            dialogue: dialogueSegments,
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

          // Detect the placeholder seeded by `createChapter` so we can
          // promote the agent's first real node over it instead of
          // leaving the placeholder as the section's start. The
          // placeholder id is deterministic (`${sectionName}__placeholder`).
          const placeholderId = `${chapterName}__placeholder`;
          const startIsPlaceholder = sectionData.start_id === placeholderId;
          const explicitStart = args.isStart === true;
          const noStartYet = !sectionData.start_id;
          const shouldBeStart = explicitStart || noStartYet || startIsPlaceholder;

          if (shouldBeStart && nodeId !== placeholderId) {
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
            // If the previous start was a placeholder we seeded, drop
            // it. `deleteNode` also cleans up its dangling section→
            // placeholder connection in the same set() call.
            if (
              startIsPlaceholder &&
              useStoryStore.getState().nodes.some((n) => n.id === placeholderId)
            ) {
              useStoryStore.getState().deleteNode(placeholderId);
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
                  dialogue: [{ text: "(stub — fill me in)", speed: 60 }],
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

        case "setSpawn": {
          mapStore.enqueueMutation({
            type: "set_spawn",
            x: Number(args.x),
            y: Number(args.y),
          });
          return { ok: true };
        }

        case "placeBeat": {
          const sectionName = String(args.sectionName ?? "");
          if (!sectionName) {
            return { ok: false, error: "sectionName is required." };
          }
          const section = story.nodes.find(
            (n) =>
              n.type === "section" &&
              (n.data as Section).name === sectionName,
          );
          if (!section) {
            return {
              ok: false,
              error: `Section "${sectionName}" not found. Call createChapter first.`,
            };
          }
          const sectionData = section.data as Section;
          if (sectionData.kind !== "beat") {
            return {
              ok: false,
              error: `Section "${sectionName}" has kind:'${sectionData.kind ?? "beat"}'. Only kind:'beat' sections can be placed on the map.`,
            };
          }
          const nodeId = args.nodeId ? String(args.nodeId) : undefined;
          if (nodeId) {
            const exists = story.nodes.some(
              (n) => n.id === nodeId && n.type === "dialogue",
            );
            if (!exists) {
              return {
                ok: false,
                error: `Dialogue node "${nodeId}" not found.`,
              };
            }
          }
          mapStore.enqueueMutation({
            type: "place_beat",
            sectionName,
            nodeId,
            name: String(args.name ?? sectionData.title ?? sectionName),
            x: Number(args.x),
            y: Number(args.y),
            radius:
              typeof args.radius === "number" ? Number(args.radius) : undefined,
            oneShot:
              typeof args.oneShot === "boolean" ? Boolean(args.oneShot) : undefined,
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

  // Hand the stable dispatcher out to the host once. Hosts (e.g. the
  // workbench's MCP bridge) can stash the reference and use it to
  // execute tool calls from outside the chat loop. The callback is
  // memoized on `[]` so this fires at most once per mount.
  useEffect(() => {
    onPrepDispatchReady?.(handlePrepToolCall);
  }, [onPrepDispatchReady, handlePrepToolCall]);

  const { messages, append, isLoading, stop } = useChat({
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
      // Tool-args parse failures happen occasionally when the model emits
      // malformed JSON for a tool call (notably Anthropic sometimes leaks
      // its `<parameter name="...">` XML wrapper into the JSON arg stream).
      // The raw multi-line stack trace is useless to the DM, so render a
      // single-line recovery message instead and log the full error to the
      // console for diagnostics.
      const msg = error.message ?? String(error);
      const isToolArgsError =
        /Invalid arguments for tool|JSON parsing failed|tool input did not match/i.test(
          msg,
        );
      if (isToolArgsError) {
        console.log("[v0] tool args parse error:", msg);
        termRef.current?.write(
          `${ANSI.dimText}The agent fumbled that tool call — try asking again.${ANSI.reset}\r\n`,
        );
      } else {
        termRef.current?.write(formatError(msg) + "\r\n");
      }
      showPrompt();
    },
  });

  const redrawLine = useCallback((line: string) => {
    const term = termRef.current;
    if (!term) return;
    const auto = useDmContextStore.getState().autoMode;
    term.write(ANSI.cursorToStart + ANSI.clearLine);
    term.write(`${formatPromptInline(auto)}${line}`);
  }, []);

  // Keep the prompt's [auto] tag in sync with the store. The slash-command
  // path already redraws on submit, but anything else that toggles the
  // store (a future menu button, programmatic flip) would otherwise
  // leave the on-screen prompt stale until the next keystroke.
  useEffect(() => {
    return useDmContextStore.subscribe((state, prev) => {
      if (state.autoMode === prev.autoMode) return;
      if (!promptShownRef.current) return;
      if (pickerRef.current || isStreamingRef.current) return;
      redrawLine(inputHandler.getBuffer());
    });
  }, [redrawLine, inputHandler]);

  const sendToAI = useCallback(
    (text: string) => {
      isStreamingRef.current = true;
      // Spinner pops on its own line below the user input. Cleared
      // automatically when the first text/tool chunk streams in
      // (see the messages effect) and re-armed after each tool
      // result so the gap before the model's next decision doesn't
      // look hung either.
      thinkingRef.current?.start("thinking");
      append({ role: "user", content: text });
    },
    [append],
  );

  /**
   * Slash-command context — gives commands a way to mutate the store
   * (auto mode), focus other panels (map / story), and export the
   * project as JSON.
   */
  const commandContext = useRef<CommandContext>({
    toggleAutoMode: () => useDmContextStore.getState().toggleAutoMode(),
    setAutoMode: (enabled: boolean) => {
      useDmContextStore.getState().setAutoMode(enabled);
      return enabled;
    },
    openSurface: (surface) => onOpenSurface?.(surface),
    exportProject: ({ force } = {}): ExportSummary => {
      const summary = runProjectExport({ force });
      return {
        ok: summary.ok,
        downloaded: summary.downloaded,
        errorCount: summary.errors.length,
        warningCount: summary.warnings.length,
        errors: summary.errors,
        warnings: summary.warnings,
      };
    },
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

      // Ctrl-C: cancel everything and reset the line. We have to handle
      // this BEFORE the isLoading guard or there's no way to bail out
      // of a runaway streaming response. Three states to cover:
      //   1. Streaming   → stop() the chat, reset bookkeeping refs,
      //                    print "^C interrupted." and re-prompt.
      //   2. Menu open   → erase menu (the rest of the line clear runs
      //                    in the idle path).
      //   3. Idle        → clear input buffer, reprint the line so the
      //                    user lands on a fresh prompt.
      if (data === "\x03") {
        const menu = commandMenuRef.current;
        menu?.erase();

        if (isLoading) {
          // Aborts the underlying fetch, which ends the stream and
          // prevents any further onToolCall fan-out. The planner's
          // server-side generateText keeps running for a beat (we
          // can't reach into it from the client) but its tokens are
          // already orphaned — they won't reach the workspace.
          stop();
          // Kill the spinner before printing the interrupt notice or
          // it'll keep redrawing over the message until the next tick.
          thinkingRef.current?.stop();
          isStreamingRef.current = false;
          toolResultRenderedRef.current.clear();
          term.write(
            `\r\n${ANSI.error}^C interrupted.${ANSI.reset}\r\n`,
          );
          promptShownRef.current = false;
          showPrompt();
          return;
        }

        // Idle interrupt — drop whatever's in the input buffer and
        // give the user a clean line.
        inputHandler.clear();
        term.write("^C\r\n");
        promptShownRef.current = false;
        showPrompt();
        return;
      }

      if (isLoading) {
        // Block other keystrokes while streaming. (Ctrl-C above is the
        // only escape hatch.)
        return;
      }

      // Lazily create the command menu on first keystroke (term is ready).
      if (!commandMenuRef.current) {
        commandMenuRef.current = new CommandMenu(term);
      }
      const menu = commandMenuRef.current;

      // Menu key interception. When the slash-command menu is visible,
      // arrow up/down navigate the highlighted row instead of falling
      // through to history. Enter accepts the selected completion (the
      // user can press Enter again to submit). Escape dismisses.
      if (menu.isVisible()) {
        if (data === "\x1b[A") {
          menu.moveSelection(-1);
          return;
        }
        if (data === "\x1b[B") {
          menu.moveSelection(1);
          return;
        }
        if (data === "\r" || data === "\n") {
          const completion = menu.selectedCompletion();
          if (completion) {
            const buffer = inputHandler.getBuffer();
            // Only accept the selection if it differs from what the user
            // typed; otherwise fall through and submit the line normally.
            if (completion.trimEnd() !== buffer) {
              const extra = completion.slice(buffer.length);
              for (const ch of extra) {
                inputHandler.processKey(ch);
                term.write(ch);
              }
              menu.refresh(inputHandler.getBuffer());
              return;
            }
          }
        }
        if (data === "\x1b") {
          menu.erase();
          return;
        }
      }

      const event = inputHandler.processKey(data);
      if (!event) return;

      switch (event.type) {
        case "char":
          term.write(event.char);
          menu.refresh(inputHandler.getBuffer());
          break;

        case "backspace":
          term.write("\b \b");
          menu.refresh(inputHandler.getBuffer());
          break;

        case "submit": {
          // Erase any open menu before the prompt advances.
          menu.erase();
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
          // History overwrites the prompt line; close the menu so it doesn't
          // describe a buffer that's no longer there.
          menu.erase();
          redrawLine(event.line);
          menu.refresh(event.line);
          break;

        // (interrupt is intercepted above the inputHandler.processKey
        // call so it can fire during streaming — input-handler still
        // emits it but we never get here.)

        case "tab": {
          const buffer = inputHandler.getBuffer();
          const completion = menu.complete(buffer);
          if (!completion) break;
          const extra = completion.slice(buffer.length);
          for (const ch of extra) {
            inputHandler.processKey(ch);
            term.write(ch);
          }
          menu.refresh(inputHandler.getBuffer());
          break;
        }
      }
    },
    [isLoading, stop, inputHandler, showPrompt, sendToAI, redrawLine, config, commandContext],
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
          // Real output is about to land — kill the spinner so its
          // line gets reclaimed before the narration writes.
          thinkingRef.current?.stop();
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
          // Same deal — spinner off so the breadcrumb owns the line.
          thinkingRef.current?.stop();
          toolCallRenderedRef.current.add(callKey);
          const label = describeToolCall(
            inv.toolName,
            (inv.args ?? {}) as Record<string, unknown>,
          );
          term.write("\r\n" + formatToolCall(label));

          // The planner is server-side and the call→result roundtrip
          // takes 5-10s while Sonnet generates. Restart the spinner
          // with a contextual label so the wait reads as activity, not
          // a hang. Other tools resolve fast (client-side prep tools
          // run synchronously in onToolCall) so no need to re-arm.
          if (inv.state === "call" && inv.toolName === "planNarrative") {
            thinkingRef.current?.start("consulting planner");
          }
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

          // Tool just completed — model now goes silent again while it
          // decides what to do next. Bridge that gap with a spinner so
          // long auto-mode runs don't show seconds of dead air between
          // breadcrumbs. The isLoading→false effect below will stop it
          // when the turn actually wraps up.
          thinkingRef.current?.start("deciding next step");
        }
      }
    }
  }, [messages, config]);

  useEffect(() => {
    if (!isLoading && isStreamingRef.current && !pickerRef.current) {
      // Stream ended cleanly — kill any spinner still ticking from the
      // last tool result so it doesn't outlive the turn.
      thinkingRef.current?.stop();
      isStreamingRef.current = false;
      showPrompt();
    }
  }, [isLoading, showPrompt]);

  /**
   * Boot the terminal — banner, welcome, prompt — exactly once, the moment
   * xterm tells us it's mounted and writable. We can't rely on a setTimeout
   * delay here because XTermWrapper does several `await import(...)` calls
   * on first load; on a cold cache those can take longer than any fixed
   * delay, and the writes silently no-op until the inner terminal exists.
   */
  const startupDone = useRef(false);
  const handleReady = useCallback(() => {
    if (startupDone.current) return;
    startupDone.current = true;
    const term = termRef.current;
    if (!term) return;
    // Optional banner first (most hosts don't supply one anymore — the
    // welcome formatter carries the title bar instead, which is plenty
    // of identity and a fraction of the visual weight).
    if (config?.banner) {
      term.write(config.banner);
    }
    term.write(config?.welcomeMessage?.() ?? formatWelcome());
    // The prompt itself carries the persistent [auto] tag now; no need
    // for a separate boot-time status line.
    showPrompt();
  }, [showPrompt, config]);

  return <XTermWrapper ref={termRef} onData={handleData} onReady={handleReady} />;
}
