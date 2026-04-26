"use client";

import { Map, BookOpen, Terminal, Search } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@dnd-agent/ui/components/tooltip";
import { Separator } from "@dnd-agent/ui/components/separator";
import { useWorkbenchStore } from "@/lib/workbench-store";
import { cn } from "@dnd-agent/ui/lib/utils";

const PANEL_ITEMS = [
  {
    id: "map-editor",
    label: "Map Editor",
    shortcut: "Ctrl+1",
    icon: Map,
  },
  {
    id: "narrative-editor",
    label: "Story Boarder",
    shortcut: "Ctrl+2",
    icon: BookOpen,
  },
  {
    id: "dm-terminal",
    label: "DM Terminal",
    shortcut: "Ctrl+3",
    icon: Terminal,
  },
] as const;

export function CommandRail() {
  const minimizedPanels = useWorkbenchStore((s) => s.minimizedPanels);
  const minimizePanel = useWorkbenchStore((s) => s.minimizePanel);
  const restorePanel = useWorkbenchStore((s) => s.restorePanel);
  const setCommandPaletteOpen = useWorkbenchStore(
    (s) => s.setCommandPaletteOpen
  );

  const togglePanel = (panelId: string) => {
    if (minimizedPanels.has(panelId)) {
      restorePanel(panelId);
    } else {
      minimizePanel(panelId);
    }
  };

  return (
    <div className="flex flex-col items-center w-12 bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Panel navigation — top section */}
      <div className="flex flex-col items-center gap-1 pt-2 flex-1">
        {PANEL_ITEMS.map((item) => {
          const isMinimized = minimizedPanels.has(item.id);
          const Icon = item.icon;

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => togglePanel(item.id)}
                  className={cn(
                    "relative flex items-center justify-center size-10 rounded-md transition-colors",
                    isMinimized
                      ? "text-sidebar-foreground/30 hover:text-sidebar-foreground/60 hover:bg-sidebar-accent/50"
                      : "text-sidebar-foreground bg-sidebar-accent"
                  )}
                >
                  {/* Visible indicator bar */}
                  {!isMinimized && (
                    <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 rounded-r-full bg-sidebar-primary" />
                  )}
                  <Icon className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span>{item.label}</span>
                <span className="ml-2 text-muted-foreground">
                  {item.shortcut}
                </span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Utility actions — bottom section */}
      <div className="flex flex-col items-center gap-1 pb-2">
        <Separator className="w-6 mb-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center justify-center size-10 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <Search className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span>Command Palette</span>
            <span className="ml-2 text-muted-foreground">Ctrl+K</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
