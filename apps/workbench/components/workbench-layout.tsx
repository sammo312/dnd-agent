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
import { CommandRail } from "./command-rail";
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

  useWorkbenchShortcuts();

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      const api = event.api;

      // Store the API reference for use across components
      setDockviewApi(api);

      // Add map editor (left, takes most space)
      const mapPanel = api.addPanel({
        id: "map-editor",
        component: "mapEditor",
        title: "Map Editor",
      });

      // Add narrative editor to the right of map editor
      const narrativePanel = api.addPanel({
        id: "narrative-editor",
        component: "narrativeEditor",
        title: "Story Boarder",
        position: { referencePanel: mapPanel, direction: "right" },
      });

      // Add DM terminal at the bottom spanning full width
      api.addPanel({
        id: "dm-terminal",
        component: "dmTerminal",
        title: "DM Terminal",
        position: { referencePanel: mapPanel, direction: "below" },
      });

      // Set initial sizes: map 50%, narrative 50% horizontally; terminal 30% vertically
      try {
        mapPanel.group?.api.setSize({ width: 600 });
        narrativePanel.group?.api.setSize({ width: 500 });
      } catch {
        // sizing may fail if layout not ready yet
      }
    },
    [setDockviewApi]
  );

  return (
    <div className="h-screen w-screen flex">
      <CommandRail />
      <div className="flex-1 min-w-0">
        <DockviewReact
          className="dockview-theme-abyss"
          onReady={onReady}
          components={components}
          rightHeaderActionsComponent={PanelHeaderActions}
        />
      </div>
      <CommandPalette />
    </div>
  );
}
