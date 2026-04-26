"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { cn } from "@dnd-agent/ui/lib/utils"
import {
  type TerrainType,
  type POIItem,
  type PlacedPOI,
  type NamedRegion,
  type NarrativeSchema,
  type PlacedNarrativeBeat,
  naturalTerrains,
  humanMadeTerrains,
  poiCategories,
  terrainElevations,
} from "../lib/terrain-types"
import { Button } from "@dnd-agent/ui/components/button"
import { Input } from "@dnd-agent/ui/components/input"
import { ScrollArea } from "@dnd-agent/ui/components/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@dnd-agent/ui/components/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@dnd-agent/ui/components/tooltip"
import {
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
  Mountain,
  MapPin,
  Map,
  Search,
  Trash2,
  Pencil,
  Check,
  X,
  RefreshCw,
  BookOpen,
  MessageSquare,
  Upload,
  GripVertical,
  Play,
  Paintbrush,
  Trees,
  Building2,
  Palette,
} from "lucide-react"
import { Label } from "@dnd-agent/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@dnd-agent/ui/components/select"
import { generatePOIName, generateRegionName } from "../lib/name-generator"
import type { EditorTool } from "./editor-toolbar"

interface LeftPanelProps {
  activeTool: EditorTool
  selectedTerrain: TerrainType | null
  onSelectTerrain: (terrain: TerrainType | null) => void
  selectedPOI: POIItem | null
  onSelectPOI: (poi: POIItem | null) => void
  pois: PlacedPOI[]
  selectedPlacedPOI: PlacedPOI | null
  onSelectPlacedPOI: (poi: PlacedPOI | null) => void
  onRenamePOI: (id: string, name: string) => void
  onDeletePOI: (id: string) => void
  regions: NamedRegion[]
  selectedRegion: string | null
  onSelectRegion: (id: string | null) => void
  onRenameRegion: (id: string, name: string) => void
  onDeleteRegion: (id: string) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  // Narrative props
  narrativeSchema: NarrativeSchema | null
  onImportNarrative: (schema: NarrativeSchema) => void
  placedBeats: PlacedNarrativeBeat[]
  selectedBeat: PlacedNarrativeBeat | null
  onSelectBeat: (beat: PlacedNarrativeBeat | null) => void
  onRenameBeat: (id: string, name: string) => void
  onDeleteBeat: (id: string) => void
  collapsed?: boolean
}

type TabId = "layers" | "terrain" | "pois" | "regions" | "narrative"

export function LeftPanel({
  activeTool,
  selectedTerrain,
  onSelectTerrain,
  selectedPOI,
  onSelectPOI,
  pois,
  selectedPlacedPOI,
  onSelectPlacedPOI,
  onRenamePOI,
  onDeletePOI,
  regions,
  selectedRegion,
  onSelectRegion,
  onRenameRegion,
  onDeleteRegion,
  brushSize,
  onBrushSizeChange,
  narrativeSchema,
  onImportNarrative,
  placedBeats,
  selectedBeat,
  onSelectBeat,
  onRenameBeat,
  onDeleteBeat,
  collapsed = false,
}: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("layers")
  const [searchQuery, setSearchQuery] = useState("")
  const [editingPOI, setEditingPOI] = useState<string | null>(null)
  const [editingRegion, setEditingRegion] = useState<string | null>(null)
  const [editingBeat, setEditingBeat] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [flyoutOpen, setFlyoutOpen] = useState(false)
  const flyoutRef = useRef<HTMLDivElement>(null)

  // Close flyout when clicking outside
  useEffect(() => {
    if (!flyoutOpen) return
    const handleMouseDown = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setFlyoutOpen(false)
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [flyoutOpen])

  // Close flyout when uncollapsing
  useEffect(() => {
    if (!collapsed) setFlyoutOpen(false)
  }, [collapsed])

  const tabs = [
    { id: "layers" as TabId, icon: <Layers className="h-4 w-4" />, label: "Layers" },
    { id: "terrain" as TabId, icon: <Mountain className="h-4 w-4" />, label: "Terrain" },
    { id: "pois" as TabId, icon: <MapPin className="h-4 w-4" />, label: "POIs" },
    { id: "regions" as TabId, icon: <Map className="h-4 w-4" />, label: "Regions" },
    { id: "narrative" as TabId, icon: <BookOpen className="h-4 w-4" />, label: "Story" },
  ]

  const filteredNaturalTerrains = naturalTerrains.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredHumanTerrains = humanMadeTerrains.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const startEditingPOI = (poi: PlacedPOI) => {
    setEditingPOI(poi.id)
    setEditName(poi.name)
  }

  const savePOIName = (id: string) => {
    if (editName.trim()) {
      onRenamePOI(id, editName.trim())
    }
    setEditingPOI(null)
  }

  const regeneratePOIName = (poi: PlacedPOI) => {
    const newName = generatePOIName(poi.type)
    onRenamePOI(poi.id, newName)
  }

  const startEditingRegion = (region: NamedRegion) => {
    setEditingRegion(region.id)
    setEditName(region.name)
  }

  const saveRegionName = (id: string) => {
    if (editName.trim()) {
      onRenameRegion(id, editName.trim())
    }
    setEditingRegion(null)
  }

  const regenerateRegionName = (region: NamedRegion) => {
    const newName = generateRegionName()
    onRenameRegion(region.id, newName)
  }

  const startEditingBeat = (beat: PlacedNarrativeBeat) => {
    setEditingBeat(beat.id)
    setEditName(beat.name)
  }

  const saveBeatName = (id: string) => {
    if (editName.trim()) {
      onRenameBeat(id, editName.trim())
    }
    setEditingBeat(null)
  }

  const handleNarrativeImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        let schema: NarrativeSchema = {}
        if (Array.isArray(data)) {
          for (const item of data) {
            Object.assign(schema, item)
          }
        } else {
          schema = data
        }
        onImportNarrative(schema)
      } catch (err) {
        console.error("Failed to import narrative schema:", err)
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const formatSectionName = (name: string): string => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getNodePreview = (node: { dialogue: { text: string }[] }): string => {
    return node.dialogue
      .map((d) => d.text)
      .join("")
      .slice(0, 40)
  }

  const handleTabClick = (tabId: TabId) => {
    if (collapsed) {
      setActiveTab(tabId)
      setFlyoutOpen(true)
    } else {
      setActiveTab(tabId)
    }
  }

  // Panel content (shared between inline and flyout)
  const panelContent = (
    <ScrollArea className="flex-1">
      <div className="p-2">
        {/* Layers Tab */}
        {activeTab === "layers" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground px-2">
              Overview of all elements on the map
            </p>

            {/* POIs */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium hover:bg-muted rounded">
                <ChevronRight className="h-3 w-3 transition-transform [&[data-state=open]]:rotate-90" />
                <MapPin className="h-3.5 w-3.5" />
                POIs ({pois.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-0.5 pt-1">
                {pois.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">No POIs placed</p>
                ) : (
                  pois.map((poi) => (
                    <button
                      key={poi.id}
                      onClick={() => onSelectPlacedPOI(poi)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-muted text-left",
                        selectedPlacedPOI?.id === poi.id && "bg-primary/10 text-primary"
                      )}
                    >
                      <span>{poi.icon}</span>
                      <span className="truncate flex-1">{poi.name}</span>
                    </button>
                  ))
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Regions */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium hover:bg-muted rounded">
                <ChevronRight className="h-3 w-3 transition-transform [&[data-state=open]]:rotate-90" />
                <Map className="h-3.5 w-3.5" />
                Regions ({regions.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-0.5 pt-1">
                {regions.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">No regions defined</p>
                ) : (
                  regions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => onSelectRegion(region.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-muted text-left",
                        selectedRegion === region.id && "bg-primary/10 text-primary"
                      )}
                    >
                      <span
                        className="w-3 h-3 rounded-sm border"
                        style={{ backgroundColor: region.color }}
                      />
                      <span className="truncate flex-1">{region.name}</span>
                      <span className="text-muted-foreground">{region.pixels.length}px</span>
                    </button>
                  ))
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Narrative Beats */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium hover:bg-muted rounded">
                <ChevronRight className="h-3 w-3 transition-transform [&[data-state=open]]:rotate-90" />
                <BookOpen className="h-3.5 w-3.5" />
                Story Beats ({placedBeats.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-0.5 pt-1">
                {placedBeats.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">No beats placed</p>
                ) : (
                  placedBeats.map((beat) => (
                    <button
                      key={beat.id}
                      onClick={() => onSelectBeat(beat)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-muted text-left",
                        selectedBeat?.id === beat.id && "bg-primary/10 text-primary"
                      )}
                    >
                      {beat.type === "section" ? (
                        <BookOpen className="h-3 w-3 text-amber-500" />
                      ) : (
                        <MessageSquare className="h-3 w-3 text-sky-500" />
                      )}
                      <span className="truncate flex-1">{beat.name}</span>
                    </button>
                  ))
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Terrain Tab */}
        {activeTab === "terrain" && (
          <div className="space-y-4">
            {/* Custom Color Picker */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2 border">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide">Custom Color</span>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  className="w-10 h-10 rounded border-2 border-border cursor-pointer"
                  onChange={(e) => {
                    const customTerrain = {
                      id: 'custom',
                      name: 'Custom',
                      color: e.target.value,
                      icon: '',
                      category: 'custom' as const,
                      baseElevation: 0,
                    }
                    onSelectTerrain(customTerrain as TerrainType)
                  }}
                />
                <div className="flex-1">
                  <p className="text-xs font-medium">Pick any color</p>
                  <p className="text-[10px] text-muted-foreground">Use for custom terrain painting</p>
                </div>
              </div>
            </div>

            {/* Brush Size */}
            {activeTool === "paint" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Brush Size</span>
                  <span className="text-xs text-muted-foreground">{brushSize}x{brushSize}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((size) => (
                    <button
                      key={size}
                      onClick={() => onBrushSizeChange(size)}
                      className={cn(
                        "flex-1 py-1 text-xs rounded transition-colors",
                        brushSize === size
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search terrain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>

            {/* Natural Terrains - Always visible label */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Trees className="h-4 w-4 text-green-600" />
                <span className="text-xs font-semibold uppercase tracking-wide">Natural Terrain</span>
                <span className="text-xs text-muted-foreground ml-auto">{filteredNaturalTerrains.length}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {filteredNaturalTerrains.map((terrain) => (
                  <button
                    key={terrain.id}
                    onClick={() => onSelectTerrain(selectedTerrain?.id === terrain.id ? null : terrain)}
                    className={cn(
                      "aspect-square rounded border-2 transition-all hover:scale-105 relative group",
                      selectedTerrain?.id === terrain.id
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-muted-foreground/30"
                    )}
                    style={{ backgroundColor: terrain.color }}
                    title={`${terrain.name} (Elev: ${terrain.baseElevation > 0 ? '+' : ''}${terrain.baseElevation})`}
                  >
                    {terrain.baseElevation !== 0 && (
                      <span className="absolute bottom-0 right-0 text-[8px] font-bold bg-black/50 text-white px-0.5 rounded-tl">
                        {terrain.baseElevation > 0 ? `+${terrain.baseElevation}` : terrain.baseElevation}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Human-Made Terrains - Always visible label */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Building2 className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-semibold uppercase tracking-wide">Human-Made Terrain</span>
                <span className="text-xs text-muted-foreground ml-auto">{filteredHumanTerrains.length}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {filteredHumanTerrains.map((terrain) => (
                  <button
                    key={terrain.id}
                    onClick={() => onSelectTerrain(selectedTerrain?.id === terrain.id ? null : terrain)}
                    className={cn(
                      "aspect-square rounded border-2 transition-all hover:scale-105",
                      selectedTerrain?.id === terrain.id
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-muted-foreground/30"
                    )}
                    style={{ backgroundColor: terrain.color }}
                    title={terrain.name}
                  />
                ))}
              </div>
            </div>

            {/* Selected Terrain Info */}
            {selectedTerrain && (
              <div className="p-3 bg-muted rounded-lg space-y-3 border">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded border-2 border-primary/30"
                    style={{ backgroundColor: selectedTerrain.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{selectedTerrain.name}</p>
                    <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                      {selectedTerrain.category === 'natural' ? (
                        <Trees className="h-3 w-3" />
                      ) : selectedTerrain.category === 'human-made' ? (
                        <Building2 className="h-3 w-3" />
                      ) : (
                        <Palette className="h-3 w-3" />
                      )}
                      {selectedTerrain.category}
                    </p>
                  </div>
                </div>

                {/* Elevation Editor */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1">
                      <Mountain className="h-3 w-3" />
                      Base Elevation
                    </Label>
                    <span className={cn(
                      "text-sm font-bold",
                      selectedTerrain.baseElevation > 0 && "text-amber-600",
                      selectedTerrain.baseElevation < 0 && "text-blue-600"
                    )}>
                      {selectedTerrain.baseElevation > 0 ? `+${selectedTerrain.baseElevation}` : selectedTerrain.baseElevation}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-transparent"
                      onClick={() => {
                        const newTerrain = {
                          ...selectedTerrain,
                          baseElevation: selectedTerrain.baseElevation - 1,
                        }
                        onSelectTerrain(newTerrain as TerrainType)
                      }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <div className="flex-1 grid grid-cols-5 gap-0.5">
                      {[-2, -1, 0, 1, 2].map((val) => (
                        <button
                          key={val}
                          onClick={() => {
                            const newTerrain = {
                              ...selectedTerrain,
                              baseElevation: val,
                            }
                            onSelectTerrain(newTerrain as TerrainType)
                          }}
                          className={cn(
                            "py-1 text-[10px] rounded transition-colors",
                            selectedTerrain.baseElevation === val
                              ? "bg-primary text-primary-foreground"
                              : "bg-background hover:bg-background/80 border"
                          )}
                        >
                          {val > 0 ? `+${val}` : val}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-transparent"
                      onClick={() => {
                        const newTerrain = {
                          ...selectedTerrain,
                          baseElevation: selectedTerrain.baseElevation + 1,
                        }
                        onSelectTerrain(newTerrain as TerrainType)
                      }}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Color display */}
                <div className="flex items-center justify-between text-xs pt-2 border-t">
                  <span className="text-muted-foreground">Color</span>
                  <span className="font-mono">{selectedTerrain.color}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* POIs Tab */}
        {activeTab === "pois" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search POIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>

            {poiCategories.map((category) => {
              const filteredItems = category.items.filter((item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              if (filteredItems.length === 0) return null

              return (
                <Collapsible key={category.id} defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full px-1 py-1.5 text-xs font-medium hover:bg-muted rounded">
                    <ChevronRight className="h-3 w-3 transition-transform [&[data-state=open]]:rotate-90" />
                    {category.name} ({filteredItems.length})
                  </CollapsibleTrigger>
                  <CollapsibleContent className="grid grid-cols-4 gap-1 pt-1">
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSelectPOI(selectedPOI?.id === item.id ? null : item)}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/json", JSON.stringify(item))
                          e.dataTransfer.effectAllowed = "copy"
                        }}
                        className={cn(
                          "aspect-square rounded border-2 transition-all hover:scale-105 flex items-center justify-center text-lg bg-muted/50",
                          selectedPOI?.id === item.id
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-transparent hover:border-muted-foreground/30"
                        )}
                        title={item.name}
                      >
                        {item.icon}
                      </button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}

            {selectedPOI && (
              <div className="p-2 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedPOI.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{selectedPOI.name}</p>
                    <p className="text-xs text-muted-foreground">Click map or drag to place</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Regions Tab */}
        {activeTab === "regions" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground px-1">
              Use the Lasso tool (L) to draw regions on the map
            </p>

            {regions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Map className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No regions yet</p>
                <p className="text-xs">Draw with the Lasso tool</p>
              </div>
            ) : (
              <div className="space-y-1">
                {regions.map((region) => (
                  <div
                    key={region.id}
                    className={cn(
                      "p-2 rounded-lg border transition-colors group",
                      selectedRegion === region.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectRegion(selectedRegion === region.id ? null : region.id)}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <span
                          className="w-4 h-4 rounded border shrink-0"
                          style={{ backgroundColor: region.color }}
                        />
                        {editingRegion === region.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRegionName(region.id)
                              if (e.key === "Escape") setEditingRegion(null)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-6 text-xs"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm truncate">{region.name}</span>
                        )}
                      </button>

                      <span className="text-xs text-muted-foreground shrink-0">
                        {region.pixels.length}px
                      </span>

                      {editingRegion === region.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => saveRegionName(region.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => setEditingRegion(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              regenerateRegionName(region)
                            }}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditingRegion(region)
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive shrink-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteRegion(region.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Narrative Tab */}
        {activeTab === "narrative" && (
          <div className="space-y-3">
            {/* Import Button */}
            <label className="w-full">
              <input
                type="file"
                accept=".json"
                onChange={handleNarrativeImport}
                className="hidden"
              />
              <Button variant="outline" className="w-full gap-2 bg-transparent" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Import Narrative
                </span>
              </Button>
            </label>

            {!narrativeSchema ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No narrative loaded</p>
                <p className="text-xs">Import a JSON schema</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Placed Beats */}
                {placedBeats.length > 0 && (
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-medium hover:bg-muted rounded text-primary">
                      <ChevronRight className="h-3 w-3 transition-transform [&[data-state=open]]:rotate-90" />
                      <Play className="h-3.5 w-3.5" />
                      Placed ({placedBeats.length})
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 space-y-0.5 pt-1">
                      {placedBeats.map((beat) => (
                        <div
                          key={beat.id}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded text-xs group",
                            selectedBeat?.id === beat.id
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          <button
                            onClick={() => onSelectBeat(beat)}
                            className="flex items-center gap-2 flex-1 min-w-0 text-left"
                          >
                            {beat.type === "section" ? (
                              <BookOpen className="h-3 w-3 shrink-0 text-amber-500" />
                            ) : (
                              <MessageSquare className="h-3 w-3 shrink-0 text-sky-500" />
                            )}
                            {editingBeat === beat.id ? (
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveBeatName(beat.id)
                                  if (e.key === "Escape") setEditingBeat(null)
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-5 text-xs"
                                autoFocus
                              />
                            ) : (
                              <span className="truncate">{beat.name}</span>
                            )}
                          </button>
                          {editingBeat === beat.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0"
                                onClick={() => saveBeatName(beat.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0"
                                onClick={() => setEditingBeat(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditingBeat(beat)
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteBeat(beat.id)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <p className="text-xs text-muted-foreground px-1">
                  Drag sections or nodes to the map
                </p>

                {/* Schema Sections */}
                {Object.entries(narrativeSchema).map(([sectionId, section]) => (
                  <Collapsible key={sectionId} defaultOpen>
                    <div
                      className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-medium hover:bg-muted rounded cursor-grab active:cursor-grabbing group"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          "application/narrative-beat",
                          JSON.stringify({
                            sectionId,
                            type: "section",
                            name: formatSectionName(sectionId),
                          })
                        )
                        e.dataTransfer.effectAllowed = "copy"
                      }}
                    >
                      <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      <CollapsibleTrigger className="flex items-center gap-2 flex-1">
                        <ChevronRight className="h-3 w-3 transition-transform [&[data-state=open]]:rotate-90" />
                        <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                        <span className="flex-1 text-left">{formatSectionName(sectionId)}</span>
                        <span className="text-muted-foreground font-normal">
                          {section.nodes.length}
                        </span>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="pl-4 space-y-0.5 pt-1">
                      {section.nodes.map((node) => (
                        <div
                          key={node.id}
                          className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted cursor-grab active:cursor-grabbing group"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              "application/narrative-beat",
                              JSON.stringify({
                                sectionId,
                                nodeId: node.id,
                                type: "node",
                                name: node.id.split("_").join(" "),
                              })
                            )
                            e.dataTransfer.effectAllowed = "copy"
                          }}
                        >
                          <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                          <MessageSquare className="h-3 w-3 shrink-0 text-sky-500" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{node.id}</p>
                            <p className="text-muted-foreground truncate text-[10px]">
                              {getNodePreview(node)}...
                            </p>
                          </div>
                          {node.choices && node.choices.length > 0 && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded shrink-0">
                              {node.choices.length}
                            </span>
                          )}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  )

  // Collapsed mode: icon strip + flyout
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <div className="w-11 border-r bg-background flex flex-col shrink-0">
          {/* Vertical icon strip */}
          <div className="flex flex-col items-center py-2 gap-1 border-b">
            {tabs.map((tab) => (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      "w-8 h-8 rounded flex items-center justify-center transition-colors",
                      activeTab === tab.id && flyoutOpen
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {tab.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{tab.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Flyout overlay */}
          {flyoutOpen && (
            <div
              ref={flyoutRef}
              className="absolute left-11 top-0 bottom-0 w-64 z-30 bg-background border-r shadow-lg flex flex-col"
            >
              {/* Tab header in flyout */}
              <div className="px-3 py-2 border-b">
                <h3 className="text-sm font-semibold">{tabs.find(t => t.id === activeTab)?.label}</h3>
              </div>
              {panelContent}
            </div>
          )}
        </div>
      </TooltipProvider>
    )
  }

  // Expanded mode: full panel
  return (
    <div className="w-64 border-r bg-background flex flex-col shrink-0">
      {/* Tab Buttons */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2 px-0.5 text-[10px] font-medium flex flex-col items-center gap-0.5 transition-colors",
              activeTab === tab.id
                ? "bg-muted text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {panelContent}
    </div>
  )
}
