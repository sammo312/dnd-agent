"use client";

import { useRef, useState, useEffect } from "react";
import { useContainerSize } from "@dnd-agent/ui/hooks/use-container-size";
import { Toolbar } from "./toolbar";
import { StoryCanvas } from "./story-canvas";
import { PropertiesPanel } from "./properties-panel";
import { Button } from "@dnd-agent/ui/components/button";
import { ScrollArea } from "@dnd-agent/ui/components/scroll-area";
import { Settings2, X } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@dnd-agent/ui/components/resizable";

export function StoryBoarder() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth } = useContainerSize(containerRef);
  const isNarrow = containerWidth > 0 && containerWidth < 600;

  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const propertiesRef = useRef<HTMLDivElement>(null);

  // Close properties overlay when clicking outside
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
      {/* Header - hidden in narrow mode since dockview tab shows the title */}
      {!isNarrow && (
        <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-sidebar">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-primary-foreground"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h1 className="font-semibold text-foreground">Story Boarder</h1>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Node Editor
            </span>
          </div>
        </header>
      )}

      {/* Toolbar */}
      <Toolbar compact={isNarrow} />

      {/* Main Content */}
      {isNarrow ? (
        // Narrow mode: canvas full width + floating properties button + overlay panel
        <div className="flex-1 relative overflow-hidden">
          <StoryCanvas />

          {/* Floating properties button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 right-4 z-20 h-10 w-10 rounded-full shadow-lg"
            onClick={() => setPropertiesOpen(!propertiesOpen)}
          >
            <Settings2 className="h-5 w-5" />
          </Button>

          {/* Properties overlay panel */}
          {propertiesOpen && (
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
        // Wide mode: existing resizable panel layout
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={60} minSize={30}>
            <StoryCanvas />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
            <div className="h-full bg-card border-l border-border">
              <PropertiesPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
