"use client";

import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useStoryStore } from "../../lib/story-store";
import { Button } from "@dnd-agent/ui/components/button";
import { Input } from "@dnd-agent/ui/components/input";
import { Label } from "@dnd-agent/ui/components/label";
import { Plus, Trash2, GripVertical, Palette } from "lucide-react";
import type { DialogueSegment } from "../../lib/story-types";
import { cn } from "@dnd-agent/ui/lib/utils";
import { DialoguePreview } from "./dialogue-preview";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuLabel,
} from "@dnd-agent/ui/components/context-menu";

interface DialogueSegmentEditorProps {
  nodeId: string;
  dialogue: DialogueSegment[];
  speaker?: string;
}

const SPEED_CONVENTIONS = [
  { min: 0, max: 40, label: "EXCITED", bg: "bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-400", preset: 30 },
  { min: 41, max: 80, label: "NEUTRAL", bg: "bg-slate-500/20", border: "border-slate-500/30", text: "text-slate-400", preset: 60 },
  { min: 81, max: 150, label: "THOUGHTFUL", bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-400", preset: 115 },
  { min: 151, max: 250, label: "HESITANT", bg: "bg-orange-500/20", border: "border-orange-500/30", text: "text-orange-400", preset: 200 },
  { min: 251, max: Infinity, label: "PAUSE", bg: "bg-red-500/20", border: "border-red-500/30", text: "text-red-400", preset: 400 },
];

const COLOR_PRESETS = [
  { color: "#ff5555", label: "Red" },
  { color: "#55ff55", label: "Green" },
  { color: "#5555ff", label: "Blue" },
  { color: "#ffff55", label: "Yellow" },
  { color: "#ff55ff", label: "Magenta" },
  { color: "#55ffff", label: "Cyan" },
  { color: "#ffffff", label: "White" },
];

function getConvention(speed: number) {
  return SPEED_CONVENTIONS.find((c) => speed >= c.min && speed <= c.max) || SPEED_CONVENTIONS[1];
}

export function DialogueSegmentEditor({ nodeId, dialogue, speaker }: DialogueSegmentEditorProps) {
  const { setDialogueSegments } = useStoryStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [isDraggingLegend, setIsDraggingLegend] = useState(false);
  const [isDraggingChip, setIsDraggingChip] = useState(false);
  const [draggedChipIndex, setDraggedChipIndex] = useState<number | null>(null);

  // Drag-to-adjust speed state
  const [draggingSpeedIndex, setDraggingSpeedIndex] = useState<number | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartSpeed, setDragStartSpeed] = useState(0);

  // Text selection state for context menu
  const [textSelection, setTextSelection] = useState<{
    segmentIndex: number;
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);

  const updateText = useCallback((i: number, text: string) => {
    const updated = [...dialogue];
    updated[i] = { ...updated[i], text };
    setDialogueSegments(nodeId, updated);
  }, [dialogue, nodeId, setDialogueSegments]);

  const updateSpeed = useCallback((i: number, speed: number) => {
    const updated = [...dialogue];
    updated[i] = { ...updated[i], speed: Math.max(10, Math.min(999, speed)) };
    setDialogueSegments(nodeId, updated);
  }, [dialogue, nodeId, setDialogueSegments]);

  const updateColor = useCallback((i: number, color: string | undefined) => {
    const updated = [...dialogue];
    updated[i] = { ...updated[i], style: color ? { color } : undefined };
    setDialogueSegments(nodeId, updated);
  }, [dialogue, nodeId, setDialogueSegments]);

  const deleteSegment = useCallback((i: number) => {
    const updated = dialogue.filter((_, idx) => idx !== i);
    setDialogueSegments(nodeId, updated.length ? updated : [{ text: "", speed: 80 }]);
    setSelectedIndex(null);
  }, [dialogue, nodeId, setDialogueSegments]);

  const addSegment = useCallback(() => {
    setDialogueSegments(nodeId, [...dialogue, { text: "", speed: 80 }]);
  }, [dialogue, nodeId, setDialogueSegments]);

  const insertSegmentAt = useCallback((index: number, speed: number) => {
    const updated = [...dialogue];
    updated.splice(index, 0, { text: "", speed });
    setDialogueSegments(nodeId, updated);
  }, [dialogue, nodeId, setDialogueSegments]);

  const moveSegment = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const updated = [...dialogue];
    const [removed] = updated.splice(fromIndex, 1);
    const adjustedTo = toIndex > fromIndex ? toIndex - 1 : toIndex;
    updated.splice(adjustedTo, 0, removed);
    setDialogueSegments(nodeId, updated);
  }, [dialogue, nodeId, setDialogueSegments]);

  // Split selected text into a new segment with given speed
  const splitSelectedText = useCallback((newSpeed: number, newColor?: string) => {
    if (!textSelection) return;

    const { segmentIndex, text, startOffset, endOffset } = textSelection;
    const segment = dialogue[segmentIndex];
    const fullText = segment.text;

    const beforeText = fullText.slice(0, startOffset);
    const selectedText = text;
    const afterText = fullText.slice(endOffset);

    const newSegments: DialogueSegment[] = [];

    dialogue.forEach((seg, i) => {
      if (i === segmentIndex) {
        // Keep before text if it exists (even whitespace)
        if (beforeText.length > 0) {
          newSegments.push({ ...segment, text: beforeText });
        }
        // Always add the selected text as new segment
        if (selectedText.length > 0) {
          newSegments.push({
            text: selectedText,
            speed: newSpeed,
            style: newColor ? { color: newColor } : segment.style
          });
        }
        // Keep after text if it exists (even whitespace)
        if (afterText.length > 0) {
          newSegments.push({ ...segment, text: afterText });
        }
        // Edge case: nothing was selected, just keep segment
        if (beforeText.length === 0 && selectedText.length === 0 && afterText.length === 0) {
          newSegments.push(segment);
        }
      } else {
        newSegments.push(seg);
      }
    });

    setDialogueSegments(nodeId, newSegments);
    setTextSelection(null);
  }, [textSelection, dialogue, nodeId, setDialogueSegments]);

  // Set color on selected text (split with same speed but new color)
  const setSelectedTextColor = useCallback((color: string | undefined) => {
    if (!textSelection) return;

    const { segmentIndex, text, startOffset, endOffset } = textSelection;
    const segment = dialogue[segmentIndex];
    const fullText = segment.text;

    const beforeText = fullText.slice(0, startOffset);
    const selectedText = text;
    const afterText = fullText.slice(endOffset);

    const newSegments: DialogueSegment[] = [];

    dialogue.forEach((seg, i) => {
      if (i === segmentIndex) {
        if (beforeText.length > 0) {
          newSegments.push({ ...segment, text: beforeText });
        }
        if (selectedText.length > 0) {
          newSegments.push({
            text: selectedText,
            speed: segment.speed,
            style: color ? { color } : undefined
          });
        }
        if (afterText.length > 0) {
          newSegments.push({ ...segment, text: afterText });
        }
        if (beforeText.length === 0 && selectedText.length === 0 && afterText.length === 0) {
          newSegments.push(segment);
        }
      } else {
        newSegments.push(seg);
      }
    });

    setDialogueSegments(nodeId, newSegments);
    setTextSelection(null);
  }, [textSelection, dialogue, nodeId, setDialogueSegments]);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('chip-area')) {
      containerRef.current?.focus();
    }
  }, []);

  const handleContainerKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Don't handle delete if user is editing text inside a contentEditable
    const activeEl = document.activeElement;
    const isEditingText = activeEl?.hasAttribute('contenteditable');

    if (e.key === "Backspace" && selectedIndex !== null && dialogue.length > 0 && !isEditingText) {
      e.preventDefault();
      deleteSegment(selectedIndex);
      if (selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      } else if (dialogue.length > 1) {
        setSelectedIndex(0);
      } else {
        setSelectedIndex(null);
      }
    } else if (e.key === "ArrowLeft" && selectedIndex !== null && selectedIndex > 0 && !isEditingText) {
      e.preventDefault();
      setSelectedIndex(selectedIndex - 1);
    } else if (e.key === "ArrowRight" && selectedIndex !== null && selectedIndex < dialogue.length - 1 && !isEditingText) {
      e.preventDefault();
      setSelectedIndex(selectedIndex + 1);
    } else if (e.key === "Escape") {
      setSelectedIndex(null);
      (document.activeElement as HTMLElement)?.blur();
    }
  }, [selectedIndex, dialogue.length, deleteSegment]);

  // Track selection continuously while mouse is down in text
  const handleTextMouseUp = useCallback((segmentIndex: number) => {
    // Small delay to let selection finalize
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        const range = selection.getRangeAt(0);
        const chip = chipRefs.current.get(segmentIndex);
        if (chip) {
          const textEl = chip.querySelector('[contenteditable]');
          if (textEl && textEl.contains(range.commonAncestorContainer)) {
            setTextSelection({
              segmentIndex,
              text: selection.toString(),
              startOffset: range.startOffset,
              endOffset: range.endOffset,
            });
            return;
          }
        }
      }
      setTextSelection(null);
    }, 10);
  }, []);

  // Clear selection when clicking elsewhere
  const handleContextMenu = useCallback((segmentIndex: number) => {
    // If we already have a selection for this segment, keep it
    if (textSelection?.segmentIndex === segmentIndex) {
      return;
    }
    // Otherwise check for new selection
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const chip = chipRefs.current.get(segmentIndex);
      if (chip) {
        const textEl = chip.querySelector('[contenteditable]');
        if (textEl && textEl.contains(range.commonAncestorContainer)) {
          setTextSelection({
            segmentIndex,
            text: selection.toString(),
            startOffset: range.startOffset,
            endOffset: range.endOffset,
          });
          return;
        }
      }
    }
    setTextSelection(null);
  }, [textSelection]);

  // Speed drag handlers
  const handleSpeedDragStart = useCallback((i: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingSpeedIndex(i);
    setDragStartX(e.clientX);
    setDragStartSpeed(dialogue[i].speed);
  }, [dialogue]);

  useEffect(() => {
    if (draggingSpeedIndex === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      const newSpeed = Math.round(dragStartSpeed + deltaX);
      updateSpeed(draggingSpeedIndex, newSpeed);
    };

    const handleMouseUp = () => {
      setDraggingSpeedIndex(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingSpeedIndex, dragStartX, dragStartSpeed, updateSpeed]);

  // Legend drag
  const handleLegendDragStart = (e: React.DragEvent, conv: typeof SPEED_CONVENTIONS[0]) => {
    e.dataTransfer.setData("convention", JSON.stringify(conv));
    e.dataTransfer.effectAllowed = "copy";
    setIsDraggingLegend(true);
  };

  const handleLegendDragEnd = () => {
    setIsDraggingLegend(false);
    setDropTargetIndex(null);
  };

  // Chip drag
  const handleChipDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("chipIndex", String(index));
    e.dataTransfer.effectAllowed = "move";
    setIsDraggingChip(true);
    setDraggedChipIndex(index);
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = "0.4";
    }, 0);
  };

  const handleChipDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setIsDraggingChip(false);
    setDraggedChipIndex(null);
    setDropTargetIndex(null);
  };

  const handleDropZoneDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isDraggingChip) {
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "copy";
    }
    setDropTargetIndex(index);
  };

  const handleDropZoneDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDropZoneDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    const chipIndex = e.dataTransfer.getData("chipIndex");
    const convData = e.dataTransfer.getData("convention");

    if (chipIndex) {
      moveSegment(parseInt(chipIndex), index);
    } else if (convData) {
      const conv = JSON.parse(convData);
      insertSegmentAt(index, conv.preset);
    }

    setDropTargetIndex(null);
    setIsDraggingLegend(false);
    setIsDraggingChip(false);
    setDraggedChipIndex(null);
  };

  const isDragging = isDraggingLegend || isDraggingChip;

  // Truncate text for menu display
  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + "..." : text;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Dialogue</Label>
        <Button variant="ghost" size="sm" onClick={addSegment} className="h-5 text-[9px] gap-0.5 px-1.5">
          <Plus className="w-2.5 h-2.5" />
          Add
        </Button>
      </div>

      {/* Draggable legend */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[8px] text-muted-foreground/50 uppercase tracking-wider">Drag:</span>
        {SPEED_CONVENTIONS.map((c) => (
          <span
            key={c.label}
            draggable
            onDragStart={(e) => handleLegendDragStart(e, c)}
            onDragEnd={handleLegendDragEnd}
            className={cn(
              "px-1 py-px rounded text-[7px] font-bold tracking-wide cursor-grab active:cursor-grabbing flex items-center gap-px select-none border",
              c.bg, c.border, c.text
            )}
          >
            <GripVertical className="w-2 h-2 opacity-40" />
            {c.label}
          </span>
        ))}
      </div>

      {/* Chip editor */}
      <div
        ref={containerRef}
        tabIndex={0}
        onClick={handleContainerClick}
        onKeyDown={handleContainerKeyDown}
        className={cn(
          "relative min-h-[120px] p-2 bg-black/10 rounded outline-none focus:ring-1 focus:ring-primary/20",
          draggingSpeedIndex !== null && "cursor-ew-resize"
        )}
      >
        <div className="chip-area flex flex-wrap items-start gap-px">
          {/* Initial drop zone */}
          <div
            onDragOver={(e) => handleDropZoneDragOver(e, 0)}
            onDragLeave={handleDropZoneDragLeave}
            onDrop={(e) => handleDropZoneDrop(e, 0)}
            className={cn(
              "self-stretch flex items-center transition-all duration-75 rounded-sm",
              isDragging ? "w-3 bg-muted/20" : "w-0",
              dropTargetIndex === 0 && "w-6 bg-primary/20"
            )}
          />

          {dialogue.map((seg, i) => {
            const conv = getConvention(seg.speed);
            const isSelected = selectedIndex === i;
            const isDraggingSpeed = draggingSpeedIndex === i;
            const isBeingDragged = draggedChipIndex === i;
            const isEmpty = !seg.text.trim();
            const hasSelection = textSelection?.segmentIndex === i;

            return (
              <React.Fragment key={i}>
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div
                      ref={(el) => {
                        if (el) chipRefs.current.set(i, el);
                        else chipRefs.current.delete(i);
                      }}
                      draggable
                      onDragStart={(e) => handleChipDragStart(e, i)}
                      onDragEnd={handleChipDragEnd}
                      onClick={() => setSelectedIndex(i)}
                      onContextMenu={() => handleContextMenu(i)}
                      className={cn(
                        "inline-flex flex-col cursor-pointer rounded-sm transition-all border group",
                        conv.bg, conv.border,
                        isSelected && "ring-1 ring-primary/30",
                        isDraggingSpeed && "ring-2 ring-primary",
                        isBeingDragged && "opacity-40"
                      )}
                    >
                      {/* Header - draggable for speed */}
                      <div
                        onMouseDown={(e) => handleSpeedDragStart(i, e)}
                        className={cn(
                          "flex items-center gap-0.5 px-1 py-px cursor-ew-resize select-none",
                          isDraggingSpeed && "bg-primary/20"
                        )}
                        title="Drag left/right to adjust speed"
                      >
                        <GripVertical className="w-2 h-2 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab" />
                        <span className={cn("text-[7px] font-bold tracking-wider", conv.text)}>
                          {conv.label}
                        </span>
                        <span className={cn(
                          "text-[7px] font-mono",
                          isDraggingSpeed ? "text-primary" : "text-muted-foreground/60"
                        )}>
                          {seg.speed}ms
                        </span>
                        {seg.style?.color && (
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: seg.style.color }}
                          />
                        )}
                      </div>

                      {/* Text */}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const newText = e.currentTarget.textContent || "";
                          if (newText !== seg.text) updateText(i, newText);
                        }}
                        onFocus={() => setSelectedIndex(i)}
                        onMouseUp={() => handleTextMouseUp(i)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            (e.target as HTMLElement).blur();
                          }
                          // Delete segment if empty and backspace is pressed
                          if (e.key === "Backspace" && !e.currentTarget.textContent?.trim() && dialogue.length > 1) {
                            e.preventDefault();
                            deleteSegment(i);
                          }
                        }}
                        className={cn(
                          "px-1 py-px text-sm outline-none min-w-[40px]",
                          isEmpty && "text-muted-foreground/40"
                        )}
                        style={{ color: isEmpty ? undefined : seg.style?.color }}
                      >
                        {isEmpty ? (conv.label === "PAUSE" ? "..." : "text") : seg.text}
                      </div>
                    </div>
                  </ContextMenuTrigger>

                  <ContextMenuContent className="w-56">
                    {/* Selection-specific options */}
                    {hasSelection && textSelection && (
                      <>
                        <ContextMenuLabel className="text-[10px] text-muted-foreground">
                          Selection: "{truncate(textSelection.text, 20)}"
                        </ContextMenuLabel>
                        <ContextMenuSub>
                          <ContextMenuSubTrigger className="text-xs">
                            Set selection speed
                          </ContextMenuSubTrigger>
                          <ContextMenuSubContent className="w-40">
                            {SPEED_CONVENTIONS.map((c) => (
                              <ContextMenuItem
                                key={c.label}
                                onClick={() => splitSelectedText(c.preset)}
                                className="text-xs"
                              >
                                <span className={cn("w-2 h-2 rounded-full mr-2 border", c.bg, c.border)} />
                                {c.label}
                                <span className="ml-auto text-[10px] text-muted-foreground">{c.preset}ms</span>
                              </ContextMenuItem>
                            ))}
                          </ContextMenuSubContent>
                        </ContextMenuSub>
                        <ContextMenuSub>
                          <ContextMenuSubTrigger className="text-xs">
                            <Palette className="w-3 h-3 mr-2" />
                            Set selection color
                          </ContextMenuSubTrigger>
                          <ContextMenuSubContent className="w-40">
                            {COLOR_PRESETS.map((c) => (
                              <ContextMenuItem
                                key={c.color}
                                onClick={() => setSelectedTextColor(c.color)}
                                className="text-xs"
                              >
                                <span
                                  className="w-3 h-3 rounded-sm mr-2 border border-border"
                                  style={{ backgroundColor: c.color }}
                                />
                                {c.label}
                                <span className="ml-auto text-[9px] font-mono text-muted-foreground">{c.color}</span>
                              </ContextMenuItem>
                            ))}
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              onClick={() => setSelectedTextColor(undefined)}
                              className="text-xs"
                            >
                              <span className="w-3 h-3 rounded-sm mr-2 border border-dashed border-muted-foreground" />
                              No color
                            </ContextMenuItem>
                          </ContextMenuSubContent>
                        </ContextMenuSub>
                        <ContextMenuSeparator />
                      </>
                    )}

                    {/* Segment options */}
                    <ContextMenuLabel className="text-[10px] text-muted-foreground">
                      Segment: {truncate(seg.text || "(empty)", 20)}
                    </ContextMenuLabel>
                    <ContextMenuSub>
                      <ContextMenuSubTrigger className="text-xs">Set speed</ContextMenuSubTrigger>
                      <ContextMenuSubContent className="w-40">
                        {SPEED_CONVENTIONS.map((c) => (
                          <ContextMenuItem
                            key={c.label}
                            onClick={() => updateSpeed(i, c.preset)}
                            className="text-xs"
                          >
                            <span className={cn(
                              "w-2 h-2 rounded-full mr-2 border",
                              c.bg, c.border,
                              seg.speed >= c.min && seg.speed <= c.max && "ring-1 ring-primary"
                            )} />
                            {c.label}
                            <span className="ml-auto text-[10px] text-muted-foreground">{c.preset}ms</span>
                          </ContextMenuItem>
                        ))}
                        <ContextMenuSeparator />
                        <div className="px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={seg.speed}
                              onChange={(e) => updateSpeed(i, parseInt(e.target.value) || 80)}
                              className="h-6 text-xs w-16"
                              min={10}
                              max={999}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-[10px] text-muted-foreground">ms</span>
                          </div>
                        </div>
                      </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuSub>
                      <ContextMenuSubTrigger className="text-xs">
                        <Palette className="w-3 h-3 mr-2" />
                        Set color
                        {seg.style?.color && (
                          <span
                            className="w-2 h-2 rounded-full ml-auto"
                            style={{ backgroundColor: seg.style.color }}
                          />
                        )}
                      </ContextMenuSubTrigger>
                      <ContextMenuSubContent className="w-40">
                        {COLOR_PRESETS.map((c) => (
                          <ContextMenuItem
                            key={c.color}
                            onClick={() => updateColor(i, c.color)}
                            className="text-xs"
                          >
                            <span
                              className={cn(
                                "w-3 h-3 rounded-sm mr-2 border border-border",
                                seg.style?.color === c.color && "ring-1 ring-primary"
                              )}
                              style={{ backgroundColor: c.color }}
                            />
                            {c.label}
                            <span className="ml-auto text-[9px] font-mono text-muted-foreground">{c.color}</span>
                          </ContextMenuItem>
                        ))}
                        <ContextMenuSeparator />
                        <div className="px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            <Input
                              type="color"
                              value={seg.style?.color || "#ffffff"}
                              onChange={(e) => updateColor(i, e.target.value)}
                              className="w-6 h-6 p-0.5 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Input
                              value={seg.style?.color || ""}
                              onChange={(e) => updateColor(i, e.target.value || undefined)}
                              placeholder="hex"
                              className="h-6 text-xs flex-1 font-mono"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => updateColor(i, undefined)}
                          className="text-xs"
                        >
                          <span className="w-3 h-3 rounded-sm mr-2 border border-dashed border-muted-foreground" />
                          No color
                        </ContextMenuItem>
                      </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => deleteSegment(i)}
                      className="text-xs text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete segment
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => handleDropZoneDragOver(e, i + 1)}
                  onDragLeave={handleDropZoneDragLeave}
                  onDrop={(e) => handleDropZoneDrop(e, i + 1)}
                  className={cn(
                    "self-stretch flex items-center transition-all duration-75 rounded-sm",
                    isDragging ? "w-3 bg-muted/20" : "w-0",
                    dropTargetIndex === i + 1 && "w-6 bg-primary/20"
                  )}
                />
              </React.Fragment>
            );
          })}

          {dialogue.length === 0 && (
            <span className="text-muted-foreground/40 text-[10px]">Drag a convention or click Add</span>
          )}
        </div>
      </div>

      {/* Preview */}
      <DialoguePreview dialogue={dialogue} speaker={speaker} />
    </div>
  );
}
