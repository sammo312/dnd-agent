"use client";

import { useEffect } from "react";
import { useWorkbenchStore } from "@/lib/workbench-store";

const PANEL_IDS = ["map-editor", "narrative-editor", "dm-terminal"] as const;

export function useWorkbenchShortcuts() {
  const minimizePanel = useWorkbenchStore((s) => s.minimizePanel);
  const restorePanel = useWorkbenchStore((s) => s.restorePanel);
  const setCommandPaletteOpen = useWorkbenchStore(
    (s) => s.setCommandPaletteOpen
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModKey = e.metaKey || e.ctrlKey;

      // Ctrl+K / Cmd+K — Command palette
      if (isModKey && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Ctrl+1/2/3 — Toggle panel visibility
      if (isModKey && !e.shiftKey) {
        const index = parseInt(e.key) - 1;
        if (index >= 0 && index < PANEL_IDS.length) {
          e.preventDefault();
          const panelId = PANEL_IDS[index];
          const { minimizedPanels } = useWorkbenchStore.getState();
          if (minimizedPanels.has(panelId)) {
            restorePanel(panelId);
          } else {
            minimizePanel(panelId);
          }
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [minimizePanel, restorePanel, setCommandPaletteOpen]);
}
