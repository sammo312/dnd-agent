"use client";

import type { IDockviewPanelProps } from "dockview-react";
import { StoryBoarder } from "@dnd-agent/narrative-editor";

export const NarrativePanel: React.FC<IDockviewPanelProps> = () => {
  return (
    <div className="h-full w-full overflow-hidden">
      <StoryBoarder />
    </div>
  );
};

NarrativePanel.displayName = "NarrativePanel";
