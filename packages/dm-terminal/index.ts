export { TerminalShell } from "./components/terminal-shell";
export type {
  TerminalConfig,
  TerminalShellProps,
  PrepDispatch,
} from "./components/terminal-shell";
export { XTermWrapper, type XTermHandle } from "./components/xterm-wrapper";
export { dmTools, PREP_TOOL_NAMES } from "./lib/ai/tools";
export type { DmPrepToolName } from "./lib/ai/tools";
export {
  buildSystemPrompt,
  type WorkspaceSnapshot,
} from "./lib/ai/system-prompt";
export {
  routeCommand,
  type CommandResult,
  type CommandContext,
  type ExportSummary,
} from "./lib/game/command-router";
export {
  runProjectExport,
  type ProjectExportSummary,
  type RunProjectExportOptions,
} from "./lib/export/run-export";
export {
  buildProject,
  downloadProject,
  PROJECT_EXPORT_VERSION,
  type ExportedProject,
  type ExportedSection,
  type ExportedDialogueNode,
  type ExportedChoice,
  type ExportedDialogueSegment,
  type ExportedBeat,
  type ExportedCharacter,
  type ExportedMap,
  type ExportedMapCell,
  type ExportedPOI,
  type ExportedRegion,
  type ExportedScene,
  type ExportResult,
  type ValidationIssue,
} from "./lib/export/project-export";
export { localRoll } from "./lib/game/state";
export {
  useDmContextStore,
  type Character,
  type CharacterRole,
  type SceneContext,
} from "./lib/dm-context-store";
export type { LinkSurface } from "./lib/terminal/link-card";
