/**
 * MCP HTTP server.
 *
 * Speaks the Model Context Protocol's Streamable HTTP transport: a
 * single POST endpoint that accepts JSON-RPC 2.0 requests and returns
 * JSON-RPC 2.0 responses. We implement just the methods Claude Desktop
 * (via mcp-remote) calls during a normal session:
 *
 *   - initialize        — capability handshake
 *   - tools/list        — advertise our workspace mutators
 *   - tools/call        — invoke a tool (forwarded to the workbench tab)
 *   - notifications/initialized — fire-and-forget; we just ack
 *
 * Tool calls are forwarded to the live workbench browser via an
 * in-memory bridge and dispatched through the existing
 * `handlePrepToolCall` so the same code path that powers the in-app DM
 * also powers external MCP clients. No state duplication.
 */

import { NextRequest, NextResponse } from "next/server";
import { dispatchToolCall } from "@/lib/mcp/bridge";
import { MCP_TOOLS } from "@/lib/mcp/tool-list";

// Force Node runtime — the bridge relies on a module-level singleton
// (see bridge.ts) and the polling endpoints use long-poll semantics
// that don't fit Edge's request lifecycle.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcSuccess {
  jsonrpc: "2.0";
  id: number | string | null;
  result: unknown;
}

interface JsonRpcError {
  jsonrpc: "2.0";
  id: number | string | null;
  error: { code: number; message: string; data?: unknown };
}

const MCP_PROTOCOL_VERSION = "2024-11-05";

async function handleSingle(req: JsonRpcRequest): Promise<JsonRpcSuccess | JsonRpcError | null> {
  const id = req.id ?? null;

  // Notifications (no id) get no response per JSON-RPC spec.
  const isNotification = req.id === undefined || req.id === null;

  switch (req.method) {
    case "initialize": {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: {
            name: "dnd-workbench",
            version: "0.1.0",
          },
        },
      };
    }

    case "notifications/initialized":
    case "notifications/cancelled": {
      // Fire-and-forget; if Claude sent an id (it shouldn't), still ack.
      return isNotification ? null : { jsonrpc: "2.0", id, result: {} };
    }

    case "tools/list": {
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: MCP_TOOLS },
      };
    }

    case "tools/call": {
      const params = (req.params ?? {}) as {
        name?: string;
        arguments?: Record<string, unknown>;
      };
      const toolName = params.name;
      const args = params.arguments ?? {};
      if (!toolName) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: "Missing tool name" },
        };
      }
      // Reject unknown tools fast so we don't tie up a 30s bridge slot.
      if (!MCP_TOOLS.some((t) => t.name === toolName)) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Unknown tool: ${toolName}` },
        };
      }

      try {
        const result = await dispatchToolCall(toolName, args);
        // MCP expects a `content` array; we wrap the workbench result
        // (which is already `{ ok: true, ...} or { ok: false, error }`)
        // as a single JSON-typed text block so Claude can parse it.
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result),
              },
            ],
            isError:
              typeof result === "object" &&
              result !== null &&
              "ok" in result &&
              (result as { ok: unknown }).ok === false,
          },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: message }],
            isError: true,
          },
        };
      }
    }

    default: {
      if (isNotification) return null;
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${req.method}` },
      };
    }
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      { status: 400 },
    );
  }

  // JSON-RPC supports batch requests (array) and single requests (object).
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map((req) => handleSingle(req as JsonRpcRequest)),
    );
    const filtered = responses.filter((r) => r !== null);
    // If every entry was a notification, return 204.
    if (filtered.length === 0) return new NextResponse(null, { status: 204 });
    return NextResponse.json(filtered);
  }

  const single = body as JsonRpcRequest;
  const response = await handleSingle(single);
  if (response === null) return new NextResponse(null, { status: 204 });
  return NextResponse.json(response);
}

/**
 * GET on the MCP endpoint is used by some clients to open an SSE stream
 * for server-initiated messages. We don't push any (yet), so 405 is the
 * spec-compliant answer per Streamable HTTP — clients fall back to POST.
 */
export async function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
