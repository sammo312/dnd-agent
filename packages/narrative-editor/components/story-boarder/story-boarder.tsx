"use client";

import { useRef, useState, useEffect } from "react";
import { useContainerSize } from "@dnd-agent/ui/hooks/use-container-size";
import { useStoryStore } from "../../lib/story-store";
import { Toolbar } from "./toolbar";
import { StoryCanvas } from "./story-canvas";
import { PropertiesPanel } from "./properties-panel";
import { Button } from "@dnd-agent/ui/components/button";
import { ScrollArea } from "@dnd-agent/ui/components/scroll-area";
import { Settings2, X, PanelRightClose, PanelRightOpen } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@dnd-agent/ui/components/resizable";

export function StoryBoarder() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth } = useContainerSize(containerRef);
  const isNarrow = containerWidth > 0 && containerWidth < 600;

  const selectedNodeId = useStoryStore((s) => s.selectedNodeId);

  // Properties panel state — overlay in narrow, collapsible inline in wide
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const propertiesRef = useRef<HTMLDivElement>(null);

  // Close properties overlay when clicking outside (narrow mode)
  useEffect(() => {
    if (!propertiesOpen || !isNarrow) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (propertiesRef.current && !propertiesRef.current.contains(e.target as Node)) {
        setPropertiesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [propertiesOpen, isNarrow]);

  // Close overlay when switching to wide mode
  useEffect(() => {
    if (!isNarrow) setPropertiesOpen(false);
  }, [isNarrow]);

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <Toolbar compact={isNarrow} />

      {/* Main Content */}
      {isNarrow ? (
        // Narrow mode: canvas full width + floating properties button + overlay panel
        <div className="flex-1 relative overflow-hidden">
          <StoryCanvas />

          {/* Floating properties button — only when a node is selected */}
          {selectedNodeId && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-4 right-4 z-20 h-10 w-10 rounded-full shadow-lg"
              onClick={() => setPropertiesOpen(!propertiesOpen)}
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          )}

          {/* Properties overlay panel */}
          {propertiesOpen && selectedNodeId && (
            <div
              ref={propertiesRef}
              className="absolute top-0 right-0 bottom-0 w-72 max-w-[80%] z-30 bg-card border-l border-border shadow-lg flex flex-col animate-in slide-in-from-right duration-200"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-sm font-semibold">Properties</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setPropertiesOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <PropertiesPanel />
              </ScrollArea>
            </div>
          )}
        </div>
      ) : (
        // Wide mode: canvas + properties only when selected
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative">
            <StoryCanvas />
          </div>

          {/* Properties panel — only shown when a node is selected, manually collapsible */}
          {selectedNodeId && (
            panelCollapsed ? (
              <div className="w-10 border-l border-border bg-card flex flex-col items-center pt-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPanelCollapsed(false)}
                  title="Show properties"
                >
                  <PanelRightOpen className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Properties</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPanelCollapsed(true)}
                    title="Hide properties"
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <PropertiesPanel />
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
