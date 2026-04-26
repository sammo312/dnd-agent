export { TerminalShell } from "./components/terminal-shell";
export type { TerminalConfig } from "./components/terminal-shell";
export { XTermWrapper, type XTermHandle } from "./components/xterm-wrapper";
export { dmTools, PREP_TOOL_NAMES } from "./lib/ai/tools";
export type { DmPrepToolName } from "./lib/ai/tools";
export {
  buildSystemPrompt,
  type WorkspaceSnapshot,
} from "./lib/ai/system-prompt";
export { routeCommand, type CommandResult } from "./lib/game/command-router";
export { localRoll } from "./lib/game/state";
export {
  useDmContextStore,
  type Character,
  type CharacterRole,
  type SceneContext,
} from "./lib/dm-context-store";
