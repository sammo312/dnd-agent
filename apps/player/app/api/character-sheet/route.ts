import { NextResponse } from "next/server";
import { getCharacterSheet } from "@dnd-agent/player-terminal";

/**
 * Read-only mirror of the AI character-builder tool's in-memory
 * sheet. The Character drawer polls this on a slow interval while
 * open, so when the AI updates name / class / inventory via tool
 * calls, the visual sheet picks it up without us needing a websocket
 * or shared client store.
 *
 * Cache is disabled because the singleton mutates between requests.
 */
export async function GET() {
  return NextResponse.json(getCharacterSheet(), {
    headers: { "Cache-Control": "no-store" },
  });
}
