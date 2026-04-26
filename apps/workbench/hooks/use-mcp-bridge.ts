"use client";

import { useEffect, useState } from "react";
import { MCP_DISPATCH_KEY } from "../lib/mcp/window-dispatch";

/**
 * Public status surface for the workbench's MCP bridge connection.
 * `idle` until the first poll lands; flips to `connected` while polls
 * keep returning; never goes back to `idle` once the workbench has
 * spoken to the bridge — only to `disconnected` if a poll request
 * fails (e.g. server restart).
 */
export type McpBridgeStatus =
  | "idle"
  | "connected"
  | "disconnected";

interface UseMcpBridgeOptions {
  /**
   * Disable the bridge entirely. Used to keep the hook a no-op until
   * the user opts in via the Connect MCP dialog — we don't want the
   * workbench making a long-poll request every 25 seconds for users
   * who never plan to use MCP.
   */
  enabled: boolean;
}

interface BridgeCall {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
}

/**
 * Long-polls /api/mcp-bridge/poll and dispatches incoming tool calls
 * through the dispatcher published by the DM terminal panel
 * (window[MCP_DISPATCH_KEY]). Each call's result is POSTed back to
 * /api/mcp-bridge/result so the MCP server can return to Claude.
 *
 * The hook returns a status string suitable for an indicator UI.
 *
 * Resilience:
 *   - If the dispatcher isn't registered (terminal panel not mounted),
 *     we return a structured error so Claude sees a clear "open the
 *     workbench DM terminal" message.
 *   - Network errors trigger a short backoff before resuming polls.
 *   - The hook's internal `cancelled` flag stops new polls from firing
 *     after unmount; in-flight requests just discard their responses.
 */
export function useMcpBridge({ enabled }: UseMcpBridgeOptions): McpBridgeStatus {
  const [status, setStatus] = useState<McpBridgeStatus>("idle");

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    let cancelled = false;

    async function executeCall(call: BridgeCall): Promise<unknown> {
      const dispatch = window[MCP_DISPATCH_KEY];
      if (!dispatch) {
        return {
          ok: false,
          error:
            "Workbench DM terminal isn't open. Switch to the DM Terminal panel and try again.",
        };
      }
      try {
        return await dispatch(call.toolName, call.args);
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    async function pollOnce() {
      try {
        const res = await fetch("/api/mcp-bridge/poll", {
          method: "GET",
          // Don't cache long-polls — every request must hit the server.
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`poll ${res.status}`);
        if (cancelled) return;

        setStatus("connected");

        const data = (await res.json()) as { call: BridgeCall | null };
        if (!data.call) return; // Timeout, normal — loop will poll again.

        const result = await executeCall(data.call);
        if (cancelled) return;

        await fetch("/api/mcp-bridge/result", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: data.call.id, result }),
        });
      } catch (err) {
        if (cancelled) return;
        setStatus("disconnected");
        // Brief backoff so we don't pin the server when something is
        // genuinely broken (e.g. dev server restart).
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    // Kick off the polling loop.
    (async function loop() {
      while (!cancelled) {
        await pollOnce();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return status;
}
