"use client";

import { useEffect, useState } from "react";
import type { IDockviewHeaderActionsProps } from "dockview-react";
import { Minus, Maximize2, Minimize2 } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@dnd-agent/ui/components/tooltip";
import { useWorkbenchStore } from "@/lib/workbench-store";

export const PanelHeaderActions: React.FC<IDockviewHeaderActionsProps> = ({
  api,
  containerApi,
  panels,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const minimizePanel = useWorkbenchStore((s) => s.minimizePanel);

  // Subscribe to maximize state changes
  useEffect(() => {
    const disposable = containerApi.onDidMaximizedGroupChange(() => {
      setIsMaximized(api.isMaximized());
    });
    // Sync initial state
    setIsMaximized(api.isMaximized());
    return () => disposable.dispose();
  }, [api, containerApi]);

  const handleMinimize = () => {
    // Minimize the first panel in this group
    const panelId = panels[0]?.id;
    if (panelId) {
      minimizePanel(panelId);
    }
  };

  const handleToggleMaximize = () => {
    if (isMaximized) {
      api.exitMaximized();
    } else {
      api.maximize();
    }
  };

  return (
    <div className="flex items-center gap-0.5 pr-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleMinimize}
            className="inline-flex items-center justify-center size-6 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <Minus className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Minimize</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleToggleMaximize}
            className="inline-flex items-center justify-center size-6 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            {isMaximized ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isMaximized ? "Restore" : "Maximize"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

PanelHeaderActions.displayName = "PanelHeaderActions";
