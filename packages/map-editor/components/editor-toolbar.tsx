"use client"

import React from "react"

import { Button } from "@dnd-agent/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@dnd-agent/ui/components/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@dnd-agent/ui/components/dropdown-menu"
import { Separator } from "@dnd-agent/ui/components/separator"
import {
  MousePointer,
  Paintbrush,
  MapPin,
  Lasso,
  Undo2,
  Redo2,
  Trash2,
  Grid3X3,
  Hand,
  Link2,
  Mountain,
  MoreHorizontal,
} from "lucide-react"

export type EditorTool = "select" | "pan" | "paint" | "poi" | "lasso"

type ViewMode = "2d" | "3d"

interface EditorToolbarProps {
  activeTool: EditorTool
  onToolChange: (tool: EditorTool) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  zoom: number
  onZoomReset: () => void
  showGrid: boolean
  onToggleGrid: () => void
  showRegions: boolean
  onToggleRegions: () => void
  showAssociations: boolean
  onToggleAssociations: () => void
  showElevation: boolean
  onToggleElevation: () => void
  onClear: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

const tools: { id: EditorTool; icon: React.ReactNode; label: string; hotkey: string }[] = [
  { id: "select", icon: <MousePointer className="h-4 w-4" />, label: "Select", hotkey: "V" },
  { id: "pan", icon: <Hand className="h-4 w-4" />, label: "Pan", hotkey: "H" },
  { id: "paint", icon: <Paintbrush className="h-4 w-4" />, label: "Brush", hotkey: "B" },
  { id: "poi", icon: <MapPin className="h-4 w-4" />, label: "POI", hotkey: "P" },
  { id: "lasso", icon: <Lasso className="h-4 w-4" />, label: "Lasso", hotkey: "L" },
]

export function EditorToolbar({
  activeTool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomReset,
  showGrid,
  onToggleGrid,
  showRegions,
  onToggleRegions,
  showAssociations,
  onToggleAssociations,
  showElevation,
  onToggleElevation,
  onClear,
  viewMode,
  onViewModeChange,
}: EditorToolbarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-9 border-b bg-background flex items-center px-1.5 gap-0.5">
        {/* Tools */}
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === tool.id ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => onToolChange(tool.id)}
              >
                {tool.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tool.label} ({tool.hotkey})</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Undo / Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>

        {/* Spacer */}
        <div className="flex-1" />

        {/* 2D / 3D segmented */}
        <div className="flex items-center rounded-md border bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange("2d")}
            className={`px-2 h-6 text-xs font-medium rounded-sm transition-colors ${
              viewMode === "2d"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            2D
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("3d")}
            className={`px-2 h-6 text-xs font-medium rounded-sm transition-colors ${
              viewMode === "3d"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            3D
          </button>
        </div>

        {/* Zoom — text-only readout, click to reset; +/- via hotkeys */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onZoomReset}
              className="text-xs font-medium tabular-nums w-11 text-center text-muted-foreground hover:text-foreground rounded h-7"
            >
              {Math.round(zoom * 100)}%
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset zoom (Ctrl+0)</p>
            <p className="text-xs text-muted-foreground">Ctrl + / − to zoom</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Overflow: view toggles + clear */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={onToggleGrid}>
              <Grid3X3 className="h-4 w-4 mr-2" />
              Grid <span className="ml-auto text-xs text-muted-foreground">G</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={showRegions} onCheckedChange={onToggleRegions}>
              <MapPin className="h-4 w-4 mr-2" />
              Regions <span className="ml-auto text-xs text-muted-foreground">R</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={showAssociations} onCheckedChange={onToggleAssociations}>
              <Link2 className="h-4 w-4 mr-2" />
              Associations <span className="ml-auto text-xs text-muted-foreground">A</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={showElevation} onCheckedChange={onToggleElevation}>
              <Mountain className="h-4 w-4 mr-2" />
              Elevation <span className="ml-auto text-xs text-muted-foreground">E</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClear} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  )
}
