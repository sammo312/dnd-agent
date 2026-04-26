/**
 * Workbench posts tool-call results back here. Resolves the pending
 * promise inside the bridge so the corresponding /api/mcp request can
 * return to Claude.
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveToolCall } from "@/lib/mcp/bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ResultBody {
  id: string;
  result: unknown;
}

export async function POST(request: NextRequest) {
  let body: ResultBody;
  try {
    body = (await request.json()) as ResultBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }

  if (!body?.id) {
    return NextResponse.json(
      { ok: false, error: "Missing id" },
      { status: 400 },
    );
  }

  const matched = resolveToolCall(body.id, body.result);
  return NextResponse.json({ ok: matched });
}
