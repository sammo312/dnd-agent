"use client";

import type { IDockviewPanelProps } from "dockview-react";
import dynamic from "next/dynamic";
import { useCallback } from "react";
import { useWorkbenchStore } from "../../lib/workbench-store";
import { PanelErrorBoundary } from "./panel-error-boundary";

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

const SURFACE_PANEL_IDS: Record<"map" | "story", string> = {
  map: "map-editor",
  story: "narrative-editor",
};

export const DmTerminalPanel: React.FC<IDockviewPanelProps> = () => {
  const dockviewApi = useWorkbenchStore((s) => s.dockviewApi);
  const restorePanel = useWorkbenchStore((s) => s.restorePanel);
  const minimizedPanels = useWorkbenchStore((s) => s.minimizedPanels);

  const handleOpenSurface = useCallback(
    (surface: "map" | "story") => {
      const panelId = SURFACE_PANEL_IDS[surface];
      // If the panel is hidden or closed, restore it; restorePanel handles both.
      if (minimizedPanels.has(panelId)) {
        restorePanel(panelId);
      }
      // Then bring it to focus. Wait a tick so a freshly re-created panel exists.
      requestAnimationFrame(() => {
        const panel = dockviewApi?.getPanel(panelId);
        panel?.focus();
      });
    },
    [dockviewApi, restorePanel, minimizedPanels],
  );

  return (
    <div className="h-full w-full bg-background">
      <PanelErrorBoundary panelName="DM Terminal">
        <TerminalShell onOpenSurface={handleOpenSurface} />
      </PanelErrorBoundary>
    </div>
  );
};

DmTerminalPanel.displayName = "DmTerminalPanel";
