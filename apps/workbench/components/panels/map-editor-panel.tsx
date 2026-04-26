"use client";

import type { IDockviewPanelProps } from "dockview-react";
import { MapEditor } from "@dnd-agent/map-editor";

export const MapEditorPanel: React.FC<IDockviewPanelProps> = () => {
  return (
    <div className="h-full w-full overflow-hidden">
      <MapEditor />
    </div>
  );
};

MapEditorPanel.displayName = "MapEditorPanel";
