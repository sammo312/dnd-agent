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
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Trash2,
  Menu,
  Grid3X3,
  Eye,
  EyeOff,
  Hand,
  Link2,
  Unlink,
  Mountain,
  SlidersHorizontal,
} from "lucide-react"

export type EditorTool = "select" | "pan" | "paint" | "poi" | "lasso"

interface EditorToolbarProps {
  activeTool: EditorTool
  onToolChange: (tool: EditorTool) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  showGrid: boolean
  onToggleGrid: () => void
  showRegions: boolean
  onToggleRegions: () => void
  showAssociations: boolean
  onToggleAssociations: () => void
  showElevation: boolean
  onToggleElevation: () => void
  onExport: () => void
  onImport: () => void
  onClear: () => void
  historyLength: number
  futureLength: number
  compact?: boolean
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
  onZoomIn,
  onZoomOut,
  onZoomReset,
  showGrid,
  onToggleGrid,
  showRegions,
  onToggleRegions,
  showAssociations,
  onToggleAssociations,
  showElevation,
  onToggleElevation,
  onExport,
  onImport,
  onClear,
  historyLength,
  futureLength,
  compact = false,
}: EditorToolbarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-12 border-b bg-background flex items-center px-2 gap-1">
        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Menu className="h-4 w-4 mr-1" />
              {!compact && <span className="text-sm">File</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import JSON
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+O</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+S</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClear} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Undo/Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo (Ctrl+Z)</p>
            {historyLength > 0 && (
              <p className="text-xs text-muted-foreground">{historyLength} steps available</p>
            )}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo (Ctrl+Shift+Z)</p>
            {futureLength > 0 && (
              <p className="text-xs text-muted-foreground">{futureLength} steps available</p>
            )}
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Tools */}
        <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
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
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* View Options - inline when not compact, dropdown when compact */}
        {compact ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={onToggleGrid}>
                <Grid3X3 className="h-4 w-4 mr-2" />
                Grid (G)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={showRegions} onCheckedChange={onToggleRegions}>
                <Eye className="h-4 w-4 mr-2" />
                Regions (R)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={showAssociations} onCheckedChange={onToggleAssociations}>
                <Link2 className="h-4 w-4 mr-2" />
                Associations (A)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={showElevation} onCheckedChange={onToggleElevation}>
                <Mountain className="h-4 w-4 mr-2" />
                Elevation (E)
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showGrid ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={onToggleGrid}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Grid (G)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showRegions ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={onToggleRegions}
                >
                  {showRegions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Regions (R)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showAssociations ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={onToggleAssociations}
                >
                  {showAssociations ? <Link2 className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Associations (A)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showElevation ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={onToggleElevation}
                >
                  <Mountain className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Elevation (E)</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-muted rounded-md px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onZoomOut}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out (Ctrl+-)</TooltipContent>
          </Tooltip>

          <button
            onClick={onZoomReset}
            className="text-xs font-medium w-12 text-center hover:bg-accent rounded px-1 py-0.5"
          >
            {Math.round(zoom * 100)}%
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onZoomIn}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In (Ctrl++)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
