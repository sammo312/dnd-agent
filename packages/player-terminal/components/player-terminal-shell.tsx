"use client";

import { useMemo } from "react";
import { TerminalShell, type TerminalConfig } from "@dnd-agent/dm-terminal";
import { useIsMobile } from "@dnd-agent/ui/hooks/use-mobile";
import { PLAYER_BANNER } from "../lib/terminal/ascii-art";
import {
  formatPlayerWelcome,
  renderPlayerToolResult,
} from "../lib/terminal/output-formatter";
import { routePlayerCommand } from "../lib/game/command-router";

export function PlayerTerminalShell() {
  const isMobile = useIsMobile();

  // The player banner is also wide ASCII art and looks broken at phone
  // widths. Drop it on mobile and keep everything else (welcome, command
  // router, tool renderer) identical so the in-game CLI stays usable.
  const config = useMemo<TerminalConfig>(
    () => ({
      apiEndpoint: "/api/player-chat",
      banner: isMobile ? "" : PLAYER_BANNER,
      welcomeMessage: formatPlayerWelcome,
      commandRouter: routePlayerCommand,
      renderToolResult: renderPlayerToolResult,
    }),
    [isMobile],
  );

  return <TerminalShell config={config} />;
}
