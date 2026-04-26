"use client";

import { useStoryStore } from "../../lib/story-store";
import { Button } from "@dnd-agent/ui/components/button";
import {
  Layers,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  Home,
} from "lucide-react";
import type { StoryNode, Section, DialogueNode } from "../../lib/story-types";

interface ToolbarProps {
  compact?: boolean;
}

export function Toolbar({ compact = false }: ToolbarProps) {
  const {
    addNode,
    nodes,
    zoom,
    setZoom,
    setCanvasOffset,
  } = useStoryStore();

  const handleAddSection = () => {
    const newId = `section_${Date.now()}`;
    const existingSections = nodes.filter((n) => n.type === "section");
    const newNode: StoryNode = {
      id: newId,
      type: "section",
      position: {
        x: 100 + existingSections.length * 50,
        y: 100 + existingSections.length * 50,
      },
      data: {
        id: newId,
        name: `section_${existingSections.length + 1}`,
        start_id: "",
      } as Section,
    };
    addNode(newNode);
  };

  const handleAddDialogue = () => {
    const newId = `dialogue_${Date.now()}`;
    const existingDialogues = nodes.filter((n) => n.type === "dialogue");
    const newNode: StoryNode = {
      id: newId,
      type: "dialogue",
      position: {
        x: 450 + existingDialogues.length * 30,
        y: 100 + existingDialogues.length * 30,
      },
      data: {
        id: newId,
        speaker: "Character",
        dialogue: [{ text: "New dialogue...", speed: 80 }],
        choices: [],
      } as DialogueNode,
    };
    addNode(newNode);
  };

  const handleResetView = () => {
    setZoom(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-card border-b border-border">
      {/* Add Nodes */}
      <div className="flex items-center gap-1 pr-3 border-r border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddSection}
          className="gap-2 bg-transparent"
        >
          <Layers className="w-4 h-4 text-node-scene" />
          {!compact && <span className="hidden sm:inline">Add Section</span>}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddDialogue}
          className="gap-2 bg-transparent"
        >
          <MessageSquare className="w-4 h-4 text-node-dialogue" />
          {!compact && <span className="hidden sm:inline">Add Dialogue</span>}
        </Button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 pr-3 border-r border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom(zoom - 0.1)}
          className="h-8 w-8"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleResetView}
          className="h-8 w-8"
        >
          <Home className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom(zoom + 0.1)}
          className="h-8 w-8"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

    </div>
  );
}
