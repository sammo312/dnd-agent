"use client";

import { useCallback } from "react";
import {
  DockviewReact,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
} from "dockview-react";
import { useIsMobile } from "@dnd-agent/ui/hooks/use-mobile";
import { MapEditorPanel } from "./panels/map-editor-panel";
import { NarrativePanel } from "./panels/narrative-panel";
import { DmTerminalPanel } from "./panels/dm-terminal-panel";
import { CommandPalette } from "./command-palette";
import { ExportButton } from "./export-button";
import { McpConnectButton } from "./mcp-connect-button";
import { OpenInPlayerButton } from "./open-in-player-button";
import { NarrativeBridge } from "./narrative-bridge";
import { StaticTab } from "./static-tab";
import { MobileWorkbench } from "./mobile-workbench";
import { Toaster } from "@dnd-agent/ui/components/sonner";
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
  const isMobile = useIsMobile();

  // All hooks must run before any early return — `useIsMobile` flips on
  // resize across the breakpoint, and conditionally calling hooks below
  // would crash react with "rendered fewer hooks than expected".
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

  // Below 768px, dockview's tab/drag chrome is unusable: tab targets
  // shrink to ~30px, the splitter handles are invisible on touch, and
  // the three panels stacked horizontally have no room to breathe. Swap
  // in a purpose-built mobile shell with a bottom tab bar instead.
  if (isMobile) {
    return <MobileWorkbench />;
  }

  return (
    <div className="relative h-screen w-screen">
      <DockviewReact
        className="dockview-theme-abyss"
        onReady={onReady}
        components={components}
        tabComponents={tabComponents}
      />
      <NarrativeBridge />
      {/* Top-right rail: project-level verbs, pinned to the viewport so it
       * sits above the dockview tab strip regardless of any internal
       * stacking context dockview creates for its panels. `fixed` (not
       * `absolute`) anchors to the viewport directly. */}
      <div className="fixed right-3 top-1.5 z-[100] flex items-center gap-1.5">
        <McpConnectButton />
        <OpenInPlayerButton />
        <ExportButton />
      </div>
      <CommandPalette />
      <Toaster position="bottom-right" />
    </div>
  );
}
