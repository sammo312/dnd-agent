"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Terminal as TerminalIcon, Map as MapIcon, Network } from "lucide-react";
import { MapEditor } from "@dnd-agent/map-editor";
import { StoryBoarder } from "@dnd-agent/narrative-editor";
import { Toaster } from "@dnd-agent/ui/components/sonner";
import { cn } from "@dnd-agent/ui/lib/utils";
import { ExportButton } from "./export-button";
import { OpenInPlayerButton } from "./open-in-player-button";
import { NarrativeBridge } from "./narrative-bridge";
import { CommandPalette } from "./command-palette";
import { PanelErrorBoundary } from "./panels/panel-error-boundary";
import { ANSI } from "@dnd-agent/dm-terminal/lib/terminal/ansi";

/**
 * Terminal must stay client-only; xterm pokes at `window` during init.
 * The same `dynamic` boundary the desktop panel uses, just inlined here so
 * the mobile layout doesn't depend on the dockview panel wrappers.
 */
const TerminalShell = dynamic(
  () => import("@dnd-agent/dm-terminal").then((m) => m.TerminalShell),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <span className="text-muted-foreground animate-pulse font-mono text-sm">
          loading terminal…
        </span>
      </div>
    ),
  },
);

type MobileTab = "terminal" | "map" | "story";

const TABS: ReadonlyArray<{
  id: MobileTab;
  label: string;
  Icon: typeof TerminalIcon;
}> = [
  { id: "terminal", label: "Terminal", Icon: TerminalIcon },
  { id: "map", label: "Map", Icon: MapIcon },
  { id: "story", label: "Story", Icon: Network },
];

/**
 * Mobile-only welcome shown in place of the castle banner. The banner
 * is ~50 columns wide and still wraps at phone widths, so we drop it
 * and substitute a tighter title + the same concrete example prompt
 * the desktop welcome uses, plus a one-liner pointing at the bottom
 * tab bar (which is the part of the layout that's mobile-specific).
 */
function mobileWelcomeMessage(): string {
  return (
    `\r\n${ANSI.amber}${ANSI.bold}DM WORKBENCH${ANSI.reset}\r\n` +
    `${ANSI.dimText}AI scene prep for tabletop RPGs${ANSI.reset}\r\n` +
    `\r\n` +
    `${ANSI.text}The agent designs a playable scene — map,${ANSI.reset}\r\n` +
    `${ANSI.text}NPCs, dialogue — from one line.${ANSI.reset}\r\n` +
    `\r\n` +
    `${ANSI.dimText}Try this:${ANSI.reset}\r\n` +
    `${ANSI.amber}  ›${ANSI.reset} ${ANSI.italic}${ANSI.text}build me a haunted village${ANSI.reset}\r\n` +
    `\r\n` +
    `${ANSI.dimText}Tap Map / Story below to view those surfaces.${ANSI.reset}\r\n` +
    `${ANSI.dimText}  /auto    let the agent drive${ANSI.reset}\r\n` +
    `${ANSI.dimText}  /help    all commands${ANSI.reset}\r\n` +
    `\r\n`
  );
}

/**
 * Single-source mobile layout: a compact header with the project verbs,
 * the active surface filling the remaining viewport, and a bottom tab
 * bar to switch between Terminal / Map / Story. All three surfaces stay
 * mounted (`display:none` on inactive ones) so editor state — map zoom,
 * story canvas pan, terminal scrollback — survives tab switches, the
 * same pattern the desktop layout uses for its 2D↔3D toggle.
 */
export function MobileWorkbench() {
  const [active, setActive] = useState<MobileTab>("terminal");

  // Tab-driven surface focus parity with the desktop terminal: when the
  // agent emits a "go to map/story" link, we just flip the active tab
  // instead of trying to manipulate dockview (which isn't mounted here).
  const handleOpenSurface = useCallback((surface: "map" | "story") => {
    setActive(surface);
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-background overflow-hidden">
      {/* Top bar: project label + project-level verbs. Stays out of the
       * way (compact 36px height) so the surface gets maximum room. */}
      <header className="shrink-0 flex items-center justify-between gap-2 px-3 h-9 border-b border-amber-900/30 bg-stone-950">
        <h1 className="font-mono text-xs font-bold tracking-tight text-amber-300/90">
          DM Workbench
        </h1>
        <div className="flex items-center gap-1.5">
          <OpenInPlayerButton />
          <ExportButton />
        </div>
      </header>

      {/* Surface stack — only one is visible at a time but all three
       * stay mounted to preserve editor state across tab switches. */}
      <main className="flex-1 min-h-0 relative">
        <Surface active={active === "terminal"}>
          <PanelErrorBoundary panelName="DM Terminal">
            <TerminalShell
              onOpenSurface={handleOpenSurface}
              config={{
                // Drop the 80-col castle banner on mobile — it wraps and
                // looks broken at phone widths.
                banner: "",
                welcomeMessage: mobileWelcomeMessage,
              }}
            />
          </PanelErrorBoundary>
        </Surface>
        <Surface active={active === "map"}>
          <PanelErrorBoundary panelName="Map Editor">
            <MapEditor />
          </PanelErrorBoundary>
        </Surface>
        <Surface active={active === "story"}>
          <PanelErrorBoundary panelName="Story Boarder">
            <StoryBoarder />
          </PanelErrorBoundary>
        </Surface>
      </main>

      {/* Bottom tab bar. Padded for iOS home-indicator safe area so the
       * tab targets aren't crowded against the edge. */}
      <nav
        className="shrink-0 grid grid-cols-3 border-t border-amber-900/30 bg-stone-950"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Workbench surfaces"
      >
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                "font-mono text-[10px] uppercase tracking-wider",
                isActive
                  ? "text-amber-300"
                  : "text-stone-500 hover:text-stone-300 active:text-amber-300/80",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <NarrativeBridge />
      <CommandPalette />
      <Toaster position="top-center" />
    </div>
  );
}

/**
 * Wraps a surface so it can be cheaply hidden without unmounting. We use
 * `display: none` rather than conditional rendering specifically because
 * remounting `MapEditor` or `StoryBoarder` blows away their internal
 * editor state (zoom, pan, undo history) — the same trap the desktop
 * 2D↔3D switcher hit before we adopted this pattern.
 */
function Surface({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute inset-0"
      style={{ display: active ? "flex" : "none" }}
      aria-hidden={!active}
    >
      <div className="flex-1 min-h-0 w-full">{children}</div>
    </div>
  );
}
