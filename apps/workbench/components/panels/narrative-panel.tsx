"use client";

import type { IDockviewPanelProps } from "dockview-react";
import { StoryBoarder } from "@dnd-agent/narrative-editor";
import { PanelErrorBoundary } from "./panel-error-boundary";

export const NarrativePanel: React.FC<IDockviewPanelProps> = () => {
  return (
    <div className="h-full w-full overflow-hidden">
      <PanelErrorBoundary panelName="Story Boarder">
        <StoryBoarder />
      </PanelErrorBoundary>
    </div>
  );
};

NarrativePanel.displayName = "NarrativePanel";
