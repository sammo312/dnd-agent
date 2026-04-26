/**
 * Long-poll endpoint for the workbench browser.
 *
 * The workbench client opens a GET here and waits up to ~25s for the
 * next queued tool call to arrive. If one is already queued it returns
 * immediately. If no call arrives within the window the response is
 * `{ call: null }` and the client should poll again — this is how we
 * keep the connection-status indicator alive without hammering the
 * server.
 */

import { NextResponse } from "next/server";
import { pollNextCall } from "@/lib/mcp/bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Just under common 30s gateway timeouts so we always return cleanly.
const POLL_TIMEOUT_MS = 25_000;

export async function GET() {
  const call = await pollNextCall(POLL_TIMEOUT_MS);
  return NextResponse.json({ call });
}
