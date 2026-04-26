"use client";

import type { IDockviewPanelProps } from "dockview-react";
import { MapEditor } from "@dnd-agent/map-editor";
import { PanelErrorBoundary } from "./panel-error-boundary";

export const MapEditorPanel: React.FC<IDockviewPanelProps> = () => {
  return (
    <div className="h-full w-full overflow-hidden">
      <PanelErrorBoundary panelName="Map Editor">
        <MapEditor />
      </PanelErrorBoundary>
    </div>
  );
};

MapEditorPanel.displayName = "MapEditorPanel";
