"use client";

import { TerminalShell, type TerminalConfig } from "@dnd-agent/dm-terminal";
import {
  formatPlayerWelcome,
  renderPlayerToolResult,
} from "../lib/terminal/output-formatter";
import { routePlayerCommand } from "../lib/game/command-router";

// No banner — identity is carried by the welcome formatter (compact
// title bar + one-line product description), which works on every
// width without the wide ASCII block taking over the first paint.
const playerConfig: TerminalConfig = {
  apiEndpoint: "/api/player-chat",
  welcomeMessage: formatPlayerWelcome,
  commandRouter: routePlayerCommand,
  renderToolResult: renderPlayerToolResult,
};

export function PlayerTerminalShell() {
  return <TerminalShell config={playerConfig} />;
}
