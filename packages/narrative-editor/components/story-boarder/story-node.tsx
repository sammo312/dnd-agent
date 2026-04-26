"use client";

import React from "react"

import { useRef, useState, useCallback } from "react";
import { Layers, MessageSquare, Trash2, GripVertical } from "lucide-react";
import { cn } from "@dnd-agent/ui/lib/utils";
import type { StoryNode as StoryNodeType, DialogueNode, Section } from "../../lib/story-types";
import { useStoryStore } from "../../lib/story-store";

interface StoryNodeProps {
  node: StoryNodeType;
  isSelected: boolean;
  onStartConnection: (nodeId: string, portType: "out", choiceLabel?: string) => void;
  onEndConnection: (nodeId: string) => void;
  zoom: number;
}

export function StoryNode({
  node,
  isSelected,
  onStartConnection,
  onEndConnection,
  zoom,
}: StoryNodeProps) {
  const { selectNode, moveNode, deleteNode } = useStoryStore();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const nodeStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest(".no-drag")) return;
      e.stopPropagation();
      setIsDragging(true);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      nodeStartPos.current = { x: node.position.x, y: node.position.y };
      selectNode(node.id);

      const handleMouseMove = (e: MouseEvent) => {
        const dx = (e.clientX - dragStartPos.current.x) / zoom;
        const dy = (e.clientY - dragStartPos.current.y) / zoom;
        moveNode(node.id, {
          x: nodeStartPos.current.x + dx,
          y: nodeStartPos.current.y + dy,
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [node.id, node.position, zoom, selectNode, moveNode]
  );

  const isSection = node.type === "section";
  const data = node.data;

  return (
    <div
      ref={nodeRef}
      className={cn(
        "absolute rounded-lg border-2 bg-card shadow-xl min-w-[220px] transition-shadow",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isDragging && "cursor-grabbing opacity-90",
        !isDragging && "cursor-grab",
        isSection ? "border-node-scene" : "border-node-dialogue"
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-t-md text-foreground",
          isSection ? "bg-node-scene/20" : "bg-node-dialogue/20"
        )}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
        {isSection ? (
          <Layers className="w-4 h-4" />
        ) : (
          <MessageSquare className="w-4 h-4" />
        )}
        <span className="font-medium text-sm flex-1 truncate">
          {isSection
            ? (data as Section).name
            : `${(data as DialogueNode).speaker}: ${(data as DialogueNode).id}`}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(node.id);
          }}
          className="no-drag p-1 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 text-xs text-muted-foreground space-y-1.5">
        {isSection ? (
          <>
            {(data as Section).title && (
              <div className="text-foreground font-medium text-sm">
                {(data as Section).title}
              </div>
            )}
            <div className="truncate">
              <span className="text-foreground">Start:</span> {(data as Section).start_id || "Not set"}
            </div>
            {((data as Section).background || (data as Section).music || (data as Section).gltf) && (
              <div className="flex flex-wrap gap-1 pt-1">
                {(data as Section).background && (
                  <span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">BG</span>
                )}
                {(data as Section).music && (
                  <span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Music</span>
                )}
                {(data as Section).gltf && (
                  <span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">GLTF</span>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="line-clamp-2 italic">
              {(data as DialogueNode).dialogue.map((d) => d.text).join(" ") || "Empty dialogue"}
            </div>
            {((data as DialogueNode).gltf || (data as DialogueNode).background || (data as DialogueNode).music) && (
              <div className="flex flex-wrap gap-1 pt-1">
                {(data as DialogueNode).background && (
                  <span className="px-1.5 py-0.5 bg-node-dialogue/20 border border-node-dialogue/40 rounded text-[10px]">BG</span>
                )}
                {(data as DialogueNode).music && (
                  <span className="px-1.5 py-0.5 bg-node-dialogue/20 border border-node-dialogue/40 rounded text-[10px]">Music</span>
                )}
                {(data as DialogueNode).gltf && (
                  <span className="px-1.5 py-0.5 bg-node-dialogue/20 border border-node-dialogue/40 rounded text-[10px]">GLTF</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Port */}
      <div
        className="no-drag absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-card border-2 border-muted-foreground hover:border-primary hover:bg-primary/20 cursor-crosshair transition-colors flex items-center justify-center"
        onMouseUp={(e) => {
          e.stopPropagation();
          onEndConnection(node.id);
        }}
      >
        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
      </div>

      {/* Output Ports */}
      {isSection ? (
        <div
          className="no-drag absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-card border-2 border-node-scene hover:bg-node-scene/20 cursor-crosshair transition-colors flex items-center justify-center"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnection(node.id, "out");
          }}
        >
          <div className="w-2 h-2 rounded-full bg-node-scene" />
        </div>
      ) : (
        <div className="absolute -right-3 top-[60px] space-y-2">
          {(data as DialogueNode).choices.length === 0 ? (
            <div
              className="no-drag w-5 h-5 rounded-full bg-card border-2 border-node-dialogue hover:bg-node-dialogue/20 cursor-crosshair transition-colors flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartConnection(node.id, "out");
              }}
            >
              <div className="w-2 h-2 rounded-full bg-node-dialogue" />
            </div>
          ) : (
            (data as DialogueNode).choices.map((choice, i) => (
              <div key={choice.id} className="relative flex items-center">
                <span className="absolute right-7 text-[10px] text-node-choice whitespace-nowrap bg-card px-1 rounded">
                  {choice.label}
                </span>
                <div
                  className="no-drag w-5 h-5 rounded-full bg-card border-2 border-node-choice hover:bg-node-choice/20 cursor-crosshair transition-colors flex items-center justify-center"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onStartConnection(node.id, "out", choice.label);
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-node-choice" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
