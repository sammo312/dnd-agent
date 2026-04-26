/**
 * In-memory bridge between the MCP HTTP server and the workbench browser.
 *
 * How a tool call flows:
 *   1. Claude Desktop -> POST /api/mcp (JSON-RPC tools/call)
 *   2. /api/mcp creates a pending entry, awaits its promise.
 *   3. Workbench client (long-polling /api/mcp-bridge/poll) receives the
 *      entry and dispatches it to handlePrepToolCall in terminal-shell.
 *   4. Workbench POSTs the result to /api/mcp-bridge/result.
 *   5. The pending promise resolves; /api/mcp returns to Claude.
 *
 * Constraints / gotchas:
 *   - This is a Node module-level singleton. Works locally with `next dev`
 *     because Next reuses the same Node process across requests. It will
 *     NOT work on Vercel serverless deploys where each request can land
 *     on a different lambda instance — for that you'd swap this for a
 *     Redis-backed queue. For the hackathon demo we run locally, so this
 *     is the right level of complexity.
 *   - Each pending entry has a hard timeout so we never leak promises if
 *     the workbench tab is closed mid-call.
 */

import { randomUUID } from "node:crypto";

export interface PendingToolCall {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  resolve: (result: unknown) => void;
  reject: (reason: unknown) => void;
  /** Absolute epoch ms when this call should be auto-rejected. */
  expiresAt: number;
}

interface PendingPoll {
  resolve: (call: QueuedCall | null) => void;
  /** node setTimeout handle so we can cancel it when a call arrives. */
  timeout: NodeJS.Timeout;
}

interface QueuedCall {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
}

const TOOL_CALL_TIMEOUT_MS = 30_000;

/**
 * Module-level state. We deliberately stash it on `globalThis` so HMR in
 * `next dev` doesn't reset the queue on every code change — losing pending
 * calls during a dev save would be very confusing during the demo.
 */
interface BridgeState {
  pending: Map<string, PendingToolCall>;
  /** Calls received from MCP but not yet picked up by the workbench. */
  unsent: QueuedCall[];
  /** Workbench long-polls waiting for the next call. */
  waitingPolls: PendingPoll[];
  /** Last time the workbench polled, for the "is connected" indicator. */
  lastPollAt: number;
}

const globalKey = "__dndMcpBridgeState" as const;
type GlobalWithBridge = typeof globalThis & { [globalKey]?: BridgeState };

function getState(): BridgeState {
  const g = globalThis as GlobalWithBridge;
  if (!g[globalKey]) {
    g[globalKey] = {
      pending: new Map(),
      unsent: [],
      waitingPolls: [],
      lastPollAt: 0,
    };
  }
  return g[globalKey]!;
}

/**
 * Called by the MCP route handler. Creates a pending entry, hands the
 * call to a waiting poll if there is one (otherwise queues it), and
 * returns a promise that resolves with the workbench's tool result.
 */
export function dispatchToolCall(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const state = getState();
  const id = randomUUID();

  return new Promise<unknown>((resolve, reject) => {
    const expiresAt = Date.now() + TOOL_CALL_TIMEOUT_MS;
    const pending: PendingToolCall = {
      id,
      toolName,
      args,
      resolve,
      reject,
      expiresAt,
    };
    state.pending.set(id, pending);

    // Auto-reject if no result comes back. The setTimeout reference lives
    // on the closure so we can cancel it inside resolveToolCall.
    const timer = setTimeout(() => {
      const entry = state.pending.get(id);
      if (!entry) return;
      state.pending.delete(id);
      entry.reject(
        new Error(
          `Workbench did not respond within ${TOOL_CALL_TIMEOUT_MS / 1000}s. Is the workbench tab open?`,
        ),
      );
    }, TOOL_CALL_TIMEOUT_MS);
    // Stash the timer on the entry so we can clear it on success.
    (pending as PendingToolCall & { timer: NodeJS.Timeout }).timer = timer;

    const queued: QueuedCall = { id, toolName, args };

    // If a poll is currently waiting, hand the call directly to it.
    const waiting = state.waitingPolls.shift();
    if (waiting) {
      clearTimeout(waiting.timeout);
      waiting.resolve(queued);
      return;
    }

    // Otherwise queue for the next poll.
    state.unsent.push(queued);
  });
}

/**
 * Called by /api/mcp-bridge/poll. Returns the next queued call
 * immediately if one exists, otherwise long-polls up to `timeoutMs` for a
 * call to arrive. Returns null on timeout (the client should poll again).
 */
export function pollNextCall(timeoutMs: number): Promise<QueuedCall | null> {
  const state = getState();
  state.lastPollAt = Date.now();

  const queued = state.unsent.shift();
  if (queued) return Promise.resolve(queued);

  return new Promise<QueuedCall | null>((resolve) => {
    const timeout = setTimeout(() => {
      // Remove ourselves from the waiting list so we don't get a stale call.
      const idx = state.waitingPolls.findIndex((p) => p.timeout === timeout);
      if (idx >= 0) state.waitingPolls.splice(idx, 1);
      resolve(null);
    }, timeoutMs);

    state.waitingPolls.push({ resolve, timeout });
  });
}

/**
 * Called by /api/mcp-bridge/result. Resolves the pending promise so the
 * MCP request handler can return to Claude.
 */
export function resolveToolCall(id: string, result: unknown): boolean {
  const state = getState();
  const entry = state.pending.get(id);
  if (!entry) return false;
  state.pending.delete(id);
  const timer = (entry as PendingToolCall & { timer?: NodeJS.Timeout }).timer;
  if (timer) clearTimeout(timer);
  entry.resolve(result);
  return true;
}

/**
 * For the connection-status indicator in the workbench. Considered
 * connected if the workbench has polled within the last 5 seconds.
 */
export function getConnectionStatus(): {
  connected: boolean;
  lastPollAt: number;
  pendingCount: number;
} {
  const state = getState();
  return {
    connected: Date.now() - state.lastPollAt < 5_000,
    lastPollAt: state.lastPollAt,
    pendingCount: state.pending.size,
  };
}
