import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { getState, resetState, applyMutation } from "./state.js";
import type { GameMutation, WSMessage } from "./types.js";

// ──────────────────────────────────────────────────────
// Sync Server: thin WebSocket relay + game state store.
//
// NOT a Claude proxy. The AI lives in the Next.js API route
// where the Vercel AI SDK (useChat + streamText) handles
// conversation, streaming, and tool execution.
//
// This server only:
//   1. Holds GameState in memory
//   2. Accepts mutations via HTTP POST /mutate
//   3. Broadcasts mutations to WebSocket clients
//   4. Sends full state on WebSocket connect (reconnect-safe)
//
// Architecture:
//   useChat (DM terminal)
//     → /api/chat (streamText + world tools)
//       → world tool.execute() POSTs to /mutate
//         → sync server applies + broadcasts via WS
//           → player app receives mutation, renders 3D
// ─────────���────────────────────────────────────────────

const PORT = parseInt(process.env.SYNC_PORT || "3002", 10);
const clients = new Set<WebSocket>();

function broadcast(message: WSMessage): void {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// ── HTTP ─────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function cors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res: ServerResponse, status: number, data: unknown): void {
  cors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url || "/";
  const method = req.method || "GET";

  if (method === "OPTIONS") {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // POST /mutate — apply a mutation and broadcast
  if (url === "/mutate" && method === "POST") {
    try {
      const mutation: GameMutation = JSON.parse(await readBody(req));
      const result = applyMutation(mutation);
      if (result.ok) {
        broadcast({ type: "mutation", mutation });
        json(res, 200, { ok: true });
      } else {
        json(res, 400, { ok: false, error: result.error });
      }
    } catch (err) {
      json(res, 400, { ok: false, error: "Invalid mutation JSON" });
    }
    return;
  }

  // GET /state — current game state
  if (url === "/state" && method === "GET") {
    json(res, 200, getState());
    return;
  }

  // POST /reset — reset everything
  if (url === "/reset" && method === "POST") {
    resetState();
    broadcast({ type: "full_state", state: getState() });
    json(res, 200, { reset: true });
    return;
  }

  // GET /health
  if (url === "/health" && method === "GET") {
    json(res, 200, {
      ok: true,
      clients: clients.size,
      entities: Object.keys(getState().entities).length,
    });
    return;
  }

  json(res, 404, { error: "Not found" });
}

// ── WebSocket ────────��───────────────────────────────

const server = createServer(handleRequest);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  clients.add(ws);
  console.log(`[ws] Client connected (${clients.size} total)`);

  // Full state on connect — reconnect-safe
  ws.send(JSON.stringify({ type: "full_state", state: getState() } satisfies WSMessage));

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[ws] Client disconnected (${clients.size} total)`);
  });
  ws.on("error", (err) => {
    console.error("[ws] Error:", err);
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`
  ╔════════���═════════════════════════════════╗
  ║   THE LIVING STAGE — Sync Relay         ║
  ║   Port: ${PORT}                             ║
  ║   WebSocket: ws://localhost:${PORT}         ║
  ║   POST /mutate to push state changes    ║
  ╚═════════════��════════════════════════════╝
  `);
});
