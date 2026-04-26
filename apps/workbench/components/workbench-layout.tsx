"use client";

import { useCallback } from "react";
import {
  DockviewReact,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
} from "dockview-react";
import { MapEditorPanel } from "./panels/map-editor-panel";
import { NarrativePanel } from "./panels/narrative-panel";
import { DmTerminalPanel } from "./panels/dm-terminal-panel";
import { CommandPalette } from "./command-palette";
import { ExportButton } from "./export-button";
import { StaticTab } from "./static-tab";
import { Toaster } from "@dnd-agent/ui/components/ui/sonner";
import { useWorkbenchStore } from "@/lib/workbench-store";
import { useWorkbenchShortcuts } from "@/hooks/use-workbench-shortcuts";

const components: Record<string, React.FC<IDockviewPanelProps>> = {
  mapEditor: MapEditorPanel,
  narrativeEditor: NarrativePanel,
  dmTerminal: DmTerminalPanel,
};

const tabComponents = {
  static: StaticTab,
};

export function WorkbenchLayout() {
  const setDockviewApi = useWorkbenchStore((s) => s.setDockviewApi);
  const markPanelClosed = useWorkbenchStore((s) => s.markPanelClosed);

  useWorkbenchShortcuts();

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      const api = event.api;
      setDockviewApi(api);

      // All three surfaces live as tabs in a single dockview group.
      // Adding without a `position` puts every subsequent panel into the same
      // group as the previous one.
      const terminalPanel = api.addPanel({
        id: "dm-terminal",
        component: "dmTerminal",
        tabComponent: "static",
        title: "DM Terminal",
      });

      api.addPanel({
        id: "map-editor",
        component: "mapEditor",
        tabComponent: "static",
        title: "Map Editor",
      });

      api.addPanel({
        id: "narrative-editor",
        component: "narrativeEditor",
        tabComponent: "static",
        title: "Story Boarder",
      });

      // Dockview activates the last-added panel by default; explicitly focus
      // the terminal so it's the active tab on initial load.
      terminalPanel.api.setActive();

      // Sync state when Dockview's built-in X button removes a panel
      api.onDidRemovePanel((panel) => {
        markPanelClosed(panel.id);
      });
    },
    [setDockviewApi, markPanelClosed]
  );

  return (
    <div className="relative h-screen w-screen">
      <DockviewReact
        className="dockview-theme-abyss"
        onReady={onReady}
        components={components}
        tabComponents={tabComponents}
      />
      <ExportButton />
      <CommandPalette />
      <Toaster position="bottom-right" />
    </div>
  );
}
