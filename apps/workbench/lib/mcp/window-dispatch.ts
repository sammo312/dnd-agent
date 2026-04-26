/**
 * Tiny shared contract for the cross-component handoff between
 * `<TerminalShell>` (which owns `handlePrepToolCall`) and the workbench's
 * MCP bridge hook (which polls and needs to dispatch).
 *
 * `<TerminalShell>` exposes its dispatcher via the `onPrepDispatchReady`
 * prop. The workbench's `<DmTerminalPanel>` registers the dispatcher to
 * a typed `window` key here, and the bridge hook reads from that key.
 *
 * We use `window` instead of React Context because the bridge hook
 * lives at the layout level (peer of the terminal panel, not a parent),
 * so a context provider would have to span the entire dockview tree
 * just to plumb a single function reference. A typed singleton on
 * `window` is the pragmatic minimum.
 */

import type { PrepDispatch } from "@dnd-agent/dm-terminal";

export const MCP_DISPATCH_KEY = "__dndWorkbenchPrepDispatch" as const;

declare global {
  interface Window {
    [MCP_DISPATCH_KEY]?: PrepDispatch;
  }
}
