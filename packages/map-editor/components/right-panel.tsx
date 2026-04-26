"use client"

import { useState, useEffect } from "react"
import type {
  PlacedPOI,
  NamedRegion,
  PlacedNarrativeBeat,
  NarrativeSchema,
  NarrativeAssociation,
  MapCell,
} from "../lib/terrain-types"
import { terrainElevations, naturalTerrains, humanMadeTerrains } from "../lib/terrain-types"
import { generatePOIName, generateRegionName } from "../lib/name-generator"
import { Button } from "@dnd-agent/ui/components/button"
import { Input } from "@dnd-agent/ui/components/input"
import { Label } from "@dnd-agent/ui/components/label"
import { ScrollArea } from "@dnd-agent/ui/components/scroll-area"
import { Separator } from "@dnd-agent/ui/components/separator"
import { Badge } from "@dnd-agent/ui/components/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@dnd-agent/ui/components/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@dnd-agent/ui/components/select"
import {
  RefreshCw,
  Trash2,
  MapPin,
  Map,
  Move,
  Maximize2,
  Settings2,
  Link2,
  Unlink,
  BookOpen,
  MessageSquare,
  Plus,
  Mountain,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Box,
  Upload,
  Link,
} from "lucide-react"
import { cn } from "@dnd-agent/ui/lib/utils"

interface RightPanelProps {
  selectedPOI: PlacedPOI | null
  selectedRegion: NamedRegion | null
  selectedBeat: PlacedNarrativeBeat | null
  selectedCell: { x: number; y: number } | null
  cells: MapCell[][]
  narrativeSchema: NarrativeSchema | null
  allPOIs: PlacedPOI[]
  allBeats: PlacedNarrativeBeat[]
  onRenamePOI: (id: string, name: string) => void
  onDeletePOI: (id: string) => void
  onRenameRegion: (id: string, name: string) => void
  onDeleteRegion: (id: string) => void
  onRenameBeat: (id: string, name: string) => void
  onDeleteBeat: (id: string) => void
  onUpdatePOIAssociations: (poiId: string, associations: NarrativeAssociation[]) => void
  onUpdateBeatAssociations: (beatId: string, poiIds: string[]) => void
  onUpdatePOIGltfUrl: (poiId: string, gltfUrl: string | undefined) => void
  onCellElevationChange: (x: number, y: number, elevation: number) => void
  mapWidth: number
  mapHeight: number
  onResizeMap: (width: number, height: number) => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

const allTerrains = [...naturalTerrains, ...humanMadeTerrains]

export function RightPanel({
  selectedPOI,
  selectedRegion,
  selectedBeat,
  selectedCell,
  cells,
  narrativeSchema,
  allPOIs,
  allBeats,
  onRenamePOI,
  onDeletePOI,
  onRenameRegion,
  onDeleteRegion,
  onRenameBeat,
  onDeleteBeat,
  onUpdatePOIAssociations,
  onUpdateBeatAssociations,
  onUpdatePOIGltfUrl,
  onCellElevationChange,
  mapWidth,
  mapHeight,
  onResizeMap,
  collapsed = false,
  onToggleCollapsed,
}: RightPanelProps) {
  const [poiName, setPoiName] = useState(selectedPOI?.name || "")
  const [regionName, setRegionName] = useState(selectedRegion?.name || "")
  const [beatName, setBeatName] = useState(selectedBeat?.name || "")
  const [newWidth, setNewWidth] = useState(mapWidth)
  const [newHeight, setNewHeight] = useState(mapHeight)

  // Update local state when selection changes
  useEffect(() => {
    setPoiName(selectedPOI?.name || "")
  }, [selectedPOI?.id, selectedPOI?.name])

  useEffect(() => {
    setRegionName(selectedRegion?.name || "")
  }, [selectedRegion?.id, selectedRegion?.name])

  useEffect(() => {
    setBeatName(selectedBeat?.name || "")
  }, [selectedBeat?.id, selectedBeat?.name])

  const handlePOINameChange = (name: string) => {
    setPoiName(name)
    if (selectedPOI) {
      onRenamePOI(selectedPOI.id, name)
    }
  }

  const handleRegionNameChange = (name: string) => {
    setRegionName(name)
    if (selectedRegion) {
      onRenameRegion(selectedRegion.id, name)
    }
  }

  const handleBeatNameChange = (name: string) => {
    setBeatName(name)
    if (selectedBeat) {
      onRenameBeat(selectedBeat.id, name)
    }
  }

  const regeneratePOIName = () => {
    if (selectedPOI) {
      const newName = generatePOIName(selectedPOI.type)
      setPoiName(newName)
      onRenamePOI(selectedPOI.id, newName)
    }
  }

  const regenerateRegionName = () => {
    if (selectedRegion) {
      const newName = generateRegionName()
      setRegionName(newName)
      onRenameRegion(selectedRegion.id, newName)
    }
  }

  // Get available sections and nodes for association
  const availableSections = narrativeSchema ? Object.keys(narrativeSchema) : []

  const getNodesForSection = (sectionId: string) => {
    if (!narrativeSchema || !narrativeSchema[sectionId]) return []
    return narrativeSchema[sectionId].nodes.map((n) => n.id)
  }

  // Association handlers for POI
  const addNarrativeAssociationToPOI = (sectionId: string, nodeId?: string) => {
    if (!selectedPOI) return
    const currentAssociations = selectedPOI.narrativeAssociations || []
    // Check if already associated
    const exists = currentAssociations.some(
      (a) => a.sectionId === sectionId && a.nodeId === nodeId
    )
    if (!exists) {
      onUpdatePOIAssociations(selectedPOI.id, [
        ...currentAssociations,
        { sectionId, nodeId },
      ])
    }
  }

  const removeNarrativeAssociationFromPOI = (index: number) => {
    if (!selectedPOI) return
    const currentAssociations = selectedPOI.narrativeAssociations || []
    onUpdatePOIAssociations(
      selectedPOI.id,
      currentAssociations.filter((_, i) => i !== index)
    )
  }

  // Association handlers for Beat
  const addPOIAssociationToBeat = (poiId: string) => {
    if (!selectedBeat) return
    const currentPOIs = selectedBeat.associatedPOIs || []
    if (!currentPOIs.includes(poiId)) {
      onUpdateBeatAssociations(selectedBeat.id, [...currentPOIs, poiId])
    }
  }

  const removePOIAssociationFromBeat = (poiId: string) => {
    if (!selectedBeat) return
    const currentPOIs = selectedBeat.associatedPOIs || []
    onUpdateBeatAssociations(
      selectedBeat.id,
      currentPOIs.filter((id) => id !== poiId)
    )
  }

  const hasSelection = selectedPOI || selectedRegion || selectedBeat || selectedCell

  // Get selected cell data
  const getSelectedCellData = () => {
    if (!selectedCell) return null
    const cell = cells[selectedCell.y]?.[selectedCell.x]
    if (!cell) return null
    const terrain = allTerrains.find((t) => t.id === cell.terrain)
    const baseElevation = terrainElevations[cell.terrain] || 0
    return {
      ...cell,
      x: selectedCell.x,
      y: selectedCell.y,
      terrainName: terrain?.name || cell.terrain,
      terrainIcon: terrain?.icon || "",
      baseElevation,
      elevationOffset: cell.elevationOffset || 0,
    }
  }
  const selectedCellData = getSelectedCellData()

  // Get narrative associations for selected POI that have placed beats
  const getPOINarrativeDisplay = () => {
    if (!selectedPOI?.narrativeAssociations) return []
    return selectedPOI.narrativeAssociations.map((assoc) => {
      const matchingBeat = allBeats.find(
        (b) => b.sectionId === assoc.sectionId && b.nodeId === assoc.nodeId
      )
      return {
        ...assoc,
        beatName: matchingBeat?.name,
        displayName: assoc.nodeId
          ? `${assoc.sectionId} > ${assoc.nodeId}`
          : assoc.sectionId,
      }
    })
  }

  // Get POIs associated with selected beat
  const getBeatPOIDisplay = () => {
    if (!selectedBeat?.associatedPOIs) return []
    return selectedBeat.associatedPOIs
      .map((poiId) => allPOIs.find((p) => p.id === poiId))
      .filter(Boolean) as PlacedPOI[]
  }

  // Shared panel content
  const panelContent = (
    <>
      <div className="px-2 py-1.5 border-b flex items-center gap-1">
        {onToggleCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapsed}
                className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Collapse panel"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Collapse panel</p>
            </TooltipContent>
          </Tooltip>
        )}
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          {hasSelection ? "Properties" : "Map"}
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Map Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Map Size
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Width</Label>
                <Input
                  type="number"
                  value={newWidth}
                  onChange={(e) =>
                    setNewWidth(Math.max(5, Math.min(100, Number(e.target.value))))
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Height</Label>
                <Input
                  type="number"
                  value={newHeight}
                  onChange={(e) =>
                    setNewHeight(Math.max(5, Math.min(100, Number(e.target.value))))
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
            {(newWidth !== mapWidth || newHeight !== mapHeight) && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => onResizeMap(newWidth, newHeight)}
              >
                <Maximize2 className="h-3.5 w-3.5 mr-1" />
                Apply Size
              </Button>
            )}
          </div>

          <Separator />

          {selectedCellData && !selectedPOI && !selectedRegion && !selectedBeat ? (
            /* Cell Properties */
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Mountain className="h-3 w-3" />
                  Cell Properties
                </h3>

                <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                  <span className="text-2xl">{selectedCellData.terrainIcon}</span>
                  <div>
                    <p className="text-sm font-medium">{selectedCellData.terrainName}</p>
                    <p className="text-xs text-muted-foreground">
                      Position: ({selectedCellData.x}, {selectedCellData.y})
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Elevation</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => onCellElevationChange(
                        selectedCellData.x,
                        selectedCellData.y,
                        selectedCellData.elevation - 1
                      )}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center">
                      <span className={cn(
                        "text-lg font-bold",
                        selectedCellData.elevation > 0 && "text-amber-500",
                        selectedCellData.elevation < 0 && "text-blue-500"
                      )}>
                        {selectedCellData.elevation > 0 ? `+${selectedCellData.elevation}` : selectedCellData.elevation}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => onCellElevationChange(
                        selectedCellData.x,
                        selectedCellData.y,
                        selectedCellData.elevation + 1
                      )}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Base: {selectedCellData.baseElevation} | Offset: {selectedCellData.elevationOffset > 0 ? `+${selectedCellData.elevationOffset}` : selectedCellData.elevationOffset}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Quick Set</Label>
                  <div className="grid grid-cols-5 gap-1">
                    {[-2, -1, 0, 1, 2].map((val) => (
                      <Button
                        key={val}
                        variant={selectedCellData.elevation === val ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-7 text-xs",
                          selectedCellData.elevation !== val && "bg-transparent"
                        )}
                        onClick={() => onCellElevationChange(
                          selectedCellData.x,
                          selectedCellData.y,
                          val
                        )}
                      >
                        {val > 0 ? `+${val}` : val}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => onCellElevationChange(
                    selectedCellData.x,
                    selectedCellData.y,
                    selectedCellData.baseElevation
                  )}
                >
                  Reset to Base Elevation
                </Button>
              </div>
            </div>
          ) : selectedPOI ? (
            /* POI Properties */
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  POI Properties
                </h3>

                <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                  <span className="text-2xl">{selectedPOI.icon}</span>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {selectedPOI.type.replace(/-/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPOI.size.w}x{selectedPOI.size.h} tiles
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <div className="flex gap-1">
                    <Input
                      value={poiName}
                      onChange={(e) => handlePOINameChange(e.target.value)}
                      placeholder="Enter name..."
                      className="h-8 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0 bg-transparent"
                      onClick={regeneratePOIName}
                      title="Generate new name"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Position</Label>
                  <div className="flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded">
                    <Move className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>X: {selectedPOI.x}</span>
                    <span className="text-muted-foreground">|</span>
                    <span>Y: {selectedPOI.y}</span>
                  </div>
                </div>

                {/* 3D Model URL */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Box className="h-3 w-3" />
                    3D Model (GLTF/GLB)
                  </Label>
                  <div className="flex gap-1">
                    <Input
                      value={selectedPOI.gltfUrl || ""}
                      onChange={(e) => onUpdatePOIGltfUrl(selectedPOI.id, e.target.value || undefined)}
                      placeholder="Paste URL or upload..."
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedPOI.gltfUrl
                      ? "Model URL set - will render in 3D view"
                      : "No model - will show emoji sprite in 3D view"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Narrative Associations for POI */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Link2 className="h-3 w-3" />
                  Story Associations
                </h3>

                {narrativeSchema ? (
                  <>
                    {/* Current associations */}
                    {getPOINarrativeDisplay().length > 0 ? (
                      <div className="space-y-1">
                        {getPOINarrativeDisplay().map((assoc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-muted rounded text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {assoc.nodeId ? (
                                <MessageSquare className="h-3 w-3 text-sky-500 shrink-0" />
                              ) : (
                                <BookOpen className="h-3 w-3 text-amber-500 shrink-0" />
                              )}
                              <span className="truncate">{assoc.displayName}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => removeNarrativeAssociationFromPOI(idx)}
                            >
                              <Unlink className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No story associations yet
                      </p>
                    )}

                    {/* Add association */}
                    <div className="space-y-2">
                      <Label className="text-xs">Link to story</Label>
                      <Select
                        onValueChange={(value) => {
                          const [sectionId, nodeId] = value.split("::")
                          addNarrativeAssociationToPOI(
                            sectionId,
                            nodeId || undefined
                          )
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select section or node..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSections.map((section) => (
                            <div key={section}>
                              <SelectItem
                                value={section}
                                className="font-medium text-amber-600"
                              >
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-3 w-3" />
                                  {section}
                                </div>
                              </SelectItem>
                              {getNodesForSection(section).map((nodeId) => (
                                <SelectItem
                                  key={`${section}::${nodeId}`}
                                  value={`${section}::${nodeId}`}
                                  className="pl-6 text-sky-600"
                                >
                                  <div className="flex items-center gap-2">
                                    <MessageSquare className="h-3 w-3" />
                                    {nodeId}
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Import a narrative schema to link story beats
                  </p>
                )}
              </div>

              <Separator />

              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  onDeletePOI(selectedPOI.id)
                  setPoiName("")
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete POI
              </Button>
            </div>
          ) : selectedBeat ? (
            /* Narrative Beat Properties */
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  {selectedBeat.type === "section" ? (
                    <BookOpen className="h-3 w-3" />
                  ) : (
                    <MessageSquare className="h-3 w-3" />
                  )}
                  Story Beat Properties
                </h3>

                <div
                  className={cn(
                    "p-3 rounded-lg flex items-center gap-3",
                    selectedBeat.type === "section"
                      ? "bg-amber-500/20"
                      : "bg-sky-500/20"
                  )}
                >
                  <span className="text-2xl">
                    {selectedBeat.type === "section" ? "..." : "..."}
                  </span>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {selectedBeat.type === "section" ? "Section" : "Node"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedBeat.sectionId}
                      {selectedBeat.nodeId && ` > ${selectedBeat.nodeId}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Display Name</Label>
                  <div className="flex gap-1">
                    <Input
                      value={beatName}
                      onChange={(e) => handleBeatNameChange(e.target.value)}
                      placeholder="Enter name..."
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Position</Label>
                  <div className="flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded">
                    <Move className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>X: {selectedBeat.x}</span>
                    <span className="text-muted-foreground">|</span>
                    <span>Y: {selectedBeat.y}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* POI Associations for Beat */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Link2 className="h-3 w-3" />
                  Associated POIs
                </h3>

                {/* Current associations */}
                {getBeatPOIDisplay().length > 0 ? (
                  <div className="space-y-1">
                    {getBeatPOIDisplay().map((poi) => (
                      <div
                        key={poi.id}
                        className="flex items-center justify-between p-2 bg-muted rounded text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span>{poi.icon}</span>
                          <span className="truncate">{poi.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removePOIAssociationFromBeat(poi.id)}
                        >
                          <Unlink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No POIs associated yet
                  </p>
                )}

                {/* Add POI association */}
                {allPOIs.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">Link to POI</Label>
                    <Select onValueChange={addPOIAssociationToBeat}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select a POI..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allPOIs
                          .filter(
                            (poi) =>
                              !selectedBeat.associatedPOIs?.includes(poi.id)
                          )
                          .map((poi) => (
                            <SelectItem key={poi.id} value={poi.id}>
                              <div className="flex items-center gap-2">
                                <span>{poi.icon}</span>
                                <span>{poi.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Separator />

              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  onDeleteBeat(selectedBeat.id)
                  setBeatName("")
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Story Beat
              </Button>
            </div>
          ) : selectedRegion ? (
            /* Region Properties */
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Map className="h-3 w-3" />
                Region Properties
              </h3>

              <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: selectedRegion.color }}
                />
                <div>
                  <p className="text-sm font-medium">
                    {selectedRegion.pixels.length} tiles
                  </p>
                  <p className="text-xs text-muted-foreground">Selected area</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <div className="flex gap-1">
                  <Input
                    value={regionName}
                    onChange={(e) => handleRegionNameChange(e.target.value)}
                    placeholder="Enter name..."
                    className="h-8 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 bg-transparent"
                    onClick={regenerateRegionName}
                    title="Generate new name"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  onDeleteRegion(selectedRegion.id)
                  setRegionName("")
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Region
              </Button>
            </div>
          ) : null}
        </div>
      </ScrollArea>

      {/* Keyboard Shortcuts */}
      <div className="p-3 border-t bg-muted/30">
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">
          Shortcuts
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Undo</span>
          <span className="font-mono">Ctrl+Z</span>
          <span className="text-muted-foreground">Redo</span>
          <span className="font-mono">Ctrl+Shift+Z</span>
          <span className="text-muted-foreground">Delete</span>
          <span className="font-mono">Del</span>
          <span className="text-muted-foreground">Brush</span>
          <span className="font-mono">B</span>
          <span className="text-muted-foreground">Lasso</span>
          <span className="font-mono">L</span>
        </div>
      </div>
    </>
  )

  // Collapsed mode: thin chevron rail mirroring the left panel.
  // Auto-expand on selection (handled by the parent) covers the old
  // flyout pattern; the chevron lets the user manually re-expand.
  // The selection dot is still useful as an at-a-glance hint that
  // something is selected even while the panel is collapsed.
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <div className="w-10 border-l bg-background flex flex-col shrink-0">
          {onToggleCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCollapsed}
                  className="h-8 mx-1 mt-1 mb-0.5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative"
                  aria-label="Expand panel"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {hasSelection && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{hasSelection ? "Show properties" : "Map settings"}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    )
  }

  // Expanded mode: full panel. Wrapped in TooltipProvider so the
  // collapse-chevron tooltip in the header works.
  return (
    <TooltipProvider delayDuration={0}>
      <div className="w-72 border-l bg-background flex flex-col shrink-0">
        {panelContent}
      </div>
    </TooltipProvider>
  )
}
