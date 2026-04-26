"use client";

import { TerminalShell, type TerminalConfig } from "@dnd-agent/dm-terminal";
import { PLAYER_BANNER } from "../lib/terminal/ascii-art";
import {
  formatPlayerWelcome,
  renderPlayerToolResult,
} from "../lib/terminal/output-formatter";
import { routePlayerCommand } from "../lib/game/command-router";

const playerConfig: TerminalConfig = {
  apiEndpoint: "/api/player-chat",
  banner: PLAYER_BANNER,
  welcomeMessage: formatPlayerWelcome,
  commandRouter: routePlayerCommand,
  renderToolResult: renderPlayerToolResult,
};

export function PlayerTerminalShell() {
  return <TerminalShell config={playerConfig} />;
}
