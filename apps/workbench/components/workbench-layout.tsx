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
import { PanelHeaderActions } from "./panel-header-actions";
import { CommandPalette } from "./command-palette";
import { useWorkbenchStore } from "@/lib/workbench-store";
import { useWorkbenchShortcuts } from "@/hooks/use-workbench-shortcuts";

const components: Record<string, React.FC<IDockviewPanelProps>> = {
  mapEditor: MapEditorPanel,
  narrativeEditor: NarrativePanel,
  dmTerminal: DmTerminalPanel,
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
      // group as the previous one. The first-added panel is the active tab,
      // so the terminal opens by default.
      api.addPanel({
        id: "dm-terminal",
        component: "dmTerminal",
        title: "DM Terminal",
      });

      api.addPanel({
        id: "map-editor",
        component: "mapEditor",
        title: "Map Editor",
      });

      api.addPanel({
        id: "narrative-editor",
        component: "narrativeEditor",
        title: "Story Boarder",
      });

      // Sync state when Dockview's built-in X button removes a panel
      api.onDidRemovePanel((panel) => {
        markPanelClosed(panel.id);
      });
    },
    [setDockviewApi, markPanelClosed]
  );

  return (
    <div className="h-screen w-screen">
      <DockviewReact
        className="dockview-theme-abyss"
        onReady={onReady}
        components={components}
        rightHeaderActionsComponent={PanelHeaderActions}
      />
      <CommandPalette />
    </div>
  );
}
