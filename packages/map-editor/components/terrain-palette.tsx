"use client"

import { naturalTerrains, humanMadeTerrains, type TerrainType } from "../lib/terrain-types"
import { cn } from "@dnd-agent/ui/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@dnd-agent/ui/components/tabs"
import { ScrollArea } from "@dnd-agent/ui/components/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@dnd-agent/ui/components/tooltip"

interface TerrainPaletteProps {
  selectedTerrain: string | null
  onSelectTerrain: (terrain: TerrainType) => void
}

/**
 * Format the terrain's base elevation as a signed string (e.g. "+2",
 * "-1", "0") so the tooltip can communicate elevation at a glance —
 * matching the editor's mental model where elevation is the key
 * gameplay-relevant property after color/icon.
 */
function formatElevation(value: number): string {
  if (value === 0) return "0"
  return value > 0 ? `+${value}` : `${value}`
}

function TerrainButton({
  terrain,
  isSelected,
  onClick,
}: {
  terrain: TerrainType
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all hover:scale-105",
            isSelected
              ? "border-foreground bg-muted shadow-md"
              : "border-transparent hover:border-muted-foreground/30"
          )}
        >
          <div
            className="w-10 h-10 rounded-md shadow-inner flex items-center justify-center text-lg"
            style={{ backgroundColor: terrain.color }}
          >
            <span className="drop-shadow-sm">{terrain.icon}</span>
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[60px]">
            {terrain.name}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4} className="px-2 py-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium">{terrain.name}</span>
          <span className="text-muted-foreground/80 tabular-nums">
            elev {formatElevation(terrain.baseElevation)}
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function TerrainPalette({ selectedTerrain, onSelectTerrain }: TerrainPaletteProps) {
  return (
    // `delayDuration={0}` opens the tooltip on the first hover with no
    // wait — and `skipDelayDuration={0}` keeps follow-up hovers across
    // sibling tiles equally instant, so flicking the cursor across the
    // grid feels like reading labels rather than waiting for them.
    <TooltipProvider delayDuration={0} skipDelayDuration={0} disableHoverableContent>
      <div className="bg-card border rounded-lg p-3">
      <h3 className="font-semibold text-sm mb-2">Terrain Types</h3>
      <Tabs defaultValue="natural" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="natural" className="flex-1 text-xs">Natural</TabsTrigger>
          <TabsTrigger value="human" className="flex-1 text-xs">Human-Made</TabsTrigger>
        </TabsList>
        <TabsContent value="natural" className="mt-2">
          <ScrollArea className="h-[280px]">
            <div className="grid grid-cols-3 gap-1">
              {naturalTerrains.map((terrain) => (
                <TerrainButton
                  key={terrain.id}
                  terrain={terrain}
                  isSelected={selectedTerrain === terrain.id}
                  onClick={() => onSelectTerrain(terrain)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="human" className="mt-2">
          <ScrollArea className="h-[280px]">
            <div className="grid grid-cols-3 gap-1">
              {humanMadeTerrains.map((terrain) => (
                <TerrainButton
                  key={terrain.id}
                  terrain={terrain}
                  isSelected={selectedTerrain === terrain.id}
                  onClick={() => onSelectTerrain(terrain)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      </div>
    </TooltipProvider>
  )
}
