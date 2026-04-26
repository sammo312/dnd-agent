"use client"

import React, { useCallback, useState, useRef, useEffect } from "react"
import {
  naturalTerrains,
  humanMadeTerrains,
  type MapCell,
  type PlacedPOI,
  type POIItem,
  type TerrainType,
  type NamedRegion,
  type PlacedNarrativeBeat,
} from "../lib/terrain-types"
import { cn } from "@dnd-agent/ui/lib/utils"
import type { EditorTool } from "./editor-toolbar"

const allTerrains = [...naturalTerrains, ...humanMadeTerrains]

interface MapCanvasProps {
  width: number
  height: number
  cells: MapCell[][]
  pois: PlacedPOI[]
  regions: NamedRegion[]
  narrativeBeats: PlacedNarrativeBeat[]
  selectedTerrain: TerrainType | null
  selectedPOI: POIItem | null
  activeTool: EditorTool
  onCellClick: (x: number, y: number) => void
  onCellDrag: (x: number, y: number) => void
  onPOIDrop: (poi: POIItem, x: number, y: number) => void
  onPOIMove: (poiId: string, x: number, y: number) => void
  onPOISelect: (poi: PlacedPOI | null) => void
  onPOIDelete: (poiId: string) => void
  onLassoComplete: (pixels: { x: number; y: number }[]) => void
  onNarrativeBeatDrop: (beat: { sectionId: string; nodeId?: string; type: "section" | "node"; name: string }, x: number, y: number) => void
  onNarrativeBeatMove: (beatId: string, x: number, y: number) => void
  onNarrativeBeatSelect: (beat: PlacedNarrativeBeat | null) => void
  selectedPlacedPOI: PlacedPOI | null
  selectedNarrativeBeat: PlacedNarrativeBeat | null
  selectedRegion: string | null
  zoom: number
  showGrid: boolean
  showRegionOverlay: boolean
  showAssociations: boolean
  showElevation: boolean
  selectedCell: { x: number; y: number } | null
  onCellSelect: (x: number, y: number) => void
}

export function MapCanvas({
  width,
  height,
  cells,
  pois,
  regions,
  narrativeBeats,
  selectedTerrain,
  selectedPOI,
  activeTool,
  onCellClick,
  onCellDrag,
  onPOIDrop,
  onPOIMove,
  onPOISelect,
  onPOIDelete,
  onLassoComplete,
  onNarrativeBeatDrop,
  onNarrativeBeatMove,
  onNarrativeBeatSelect,
  selectedPlacedPOI,
  selectedNarrativeBeat,
  selectedRegion,
  zoom,
  showGrid,
  showRegionOverlay,
  showAssociations,
  showElevation,
  selectedCell,
  onCellSelect,
}: MapCanvasProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedPOI, setDraggedPOI] = useState<string | null>(null)
  const [draggedBeat, setDraggedBeat] = useState<string | null>(null)
  const [lassoPoints, setLassoPoints] = useState<{ x: number; y: number }[]>([])
  const [isLassoing, setIsLassoing] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [isSpacePanning, setIsSpacePanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle space key for temporary pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault()
        setIsSpacePanning(true)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePanning(false)
        setIsPanning(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Handle scroll wheel for panning
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    // Scroll to pan (shift+scroll for horizontal)
    setPanOffset((prev) => ({
      x: prev.x - (e.shiftKey ? e.deltaY : e.deltaX),
      y: prev.y - (e.shiftKey ? e.deltaX : e.deltaY),
    }))
  }, [])

  const cellSize = Math.round(32 * zoom)

  const getTerrainColor = (terrainId: string) => {
    const terrain = allTerrains.find((t) => t.id === terrainId)
    return terrain?.color || "#4ade80"
  }

  const getRegionForCell = (x: number, y: number): NamedRegion | undefined => {
    return regions.find((r) => r.pixels.some((p) => p.x === x && p.y === y))
  }

  const handleMouseDown = (x: number, y: number, e: React.MouseEvent) => {
    if (e.button !== 0) return

    // Space+click or pan tool = pan mode
    if (activeTool === "pan" || isSpacePanning) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
      return
    } else if (activeTool === "lasso") {
      setIsLassoing(true)
      setLassoPoints([{ x, y }])
    } else if (activeTool === "paint" && selectedTerrain) {
      setIsDragging(true)
      onCellClick(x, y)
    } else if (activeTool === "poi" && selectedPOI) {
      onCellClick(x, y)
    }
  }

  const handleMouseMove = (x: number, y: number, e?: React.MouseEvent) => {
    if (isPanning && e) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
      return
    }

    if (activeTool === "lasso" && isLassoing) {
      const lastPoint = lassoPoints[lassoPoints.length - 1]
      if (!lastPoint || lastPoint.x !== x || lastPoint.y !== y) {
        setLassoPoints((prev) => [...prev, { x, y }])
      }
    } else if (isDragging && selectedTerrain) {
      onCellDrag(x, y)
    }
  }

  const handleMouseUp = () => {
    if (activeTool === "lasso" && isLassoing && lassoPoints.length > 2) {
      const filledPixels = fillLassoPolygon(lassoPoints, width, height)
      if (filledPixels.length > 0) {
        onLassoComplete(filledPixels)
      }
    }
    setIsLassoing(false)
    setLassoPoints([])
    setIsDragging(false)
    setIsPanning(false)
  }

  const fillLassoPolygon = (
    points: { x: number; y: number }[],
    mapWidth: number,
    mapHeight: number
  ): { x: number; y: number }[] => {
    if (points.length < 3) return []

    const filled: { x: number; y: number }[] = []
    const minY = Math.max(0, Math.min(...points.map((p) => p.y)))
    const maxY = Math.min(mapHeight - 1, Math.max(...points.map((p) => p.y)))

    for (let y = minY; y <= maxY; y++) {
      const intersections: number[] = []

      for (let i = 0; i < points.length; i++) {
        const p1 = points[i]
        const p2 = points[(i + 1) % points.length]

        if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
          const x = p1.x + ((y - p1.y) / (p2.y - p1.y)) * (p2.x - p1.x)
          intersections.push(x)
        }
      }

      intersections.sort((a, b) => a - b)

      for (let i = 0; i < intersections.length; i += 2) {
        const xStart = Math.max(0, Math.ceil(intersections[i]))
        const xEnd = Math.min(mapWidth - 1, Math.floor(intersections[i + 1] || intersections[i]))

        for (let x = xStart; x <= xEnd; x++) {
          filled.push({ x, y })
        }
      }
    }

    for (const point of points) {
      if (
        point.x >= 0 &&
        point.x < mapWidth &&
        point.y >= 0 &&
        point.y < mapHeight &&
        !filled.some((f) => f.x === point.x && f.y === point.y)
      ) {
        filled.push(point)
      }
    }

    return filled
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = draggedPOI || draggedBeat ? "move" : "copy"
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = Math.floor((e.clientX - rect.left) / cellSize)
    const y = Math.floor((e.clientY - rect.top) / cellSize)

    if (draggedPOI) {
      onPOIMove(draggedPOI, x, y)
      setDraggedPOI(null)
    } else if (draggedBeat) {
      onNarrativeBeatMove(draggedBeat, x, y)
      setDraggedBeat(null)
    } else {
      // Check for narrative beat data first
      const narrativeData = e.dataTransfer.getData("application/narrative-beat")
      if (narrativeData) {
        const beat = JSON.parse(narrativeData) as { sectionId: string; nodeId?: string; type: "section" | "node"; name: string }
        onNarrativeBeatDrop(beat, x, y)
        return
      }

      // Then check for POI data
      const poiData = e.dataTransfer.getData("application/json")
      if (poiData) {
        const poi = JSON.parse(poiData) as POIItem
        onPOIDrop(poi, x, y)
      }
    }
  }

  const handlePOIDragStart = (e: React.DragEvent, poi: PlacedPOI) => {
    setDraggedPOI(poi.id)
    e.dataTransfer.effectAllowed = "move"
    onPOISelect(poi)
  }

  const handleBeatDragStart = (e: React.DragEvent, beat: PlacedNarrativeBeat) => {
    setDraggedBeat(beat.id)
    e.dataTransfer.effectAllowed = "move"
    onNarrativeBeatSelect(beat)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onPOISelect(null)
    }
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedPlacedPOI) {
        onPOIDelete(selectedPlacedPOI.id)
      }
    },
    [selectedPlacedPOI, onPOIDelete]
  )

  const getCursor = () => {
    if (isPanning) return "grabbing"
    if (activeTool === "pan" || isSpacePanning) return "grab"
    if (activeTool === "lasso") return "crosshair"
    if (activeTool === "paint" && selectedTerrain) return "crosshair"
    if (activeTool === "poi" && selectedPOI) return "copy"
    if (activeTool === "select") return "pointer"
    return "default"
  }

  // Center the canvas on mount
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current
      const canvasWidth = width * cellSize
      const canvasHeight = height * cellSize
      setPanOffset({
        x: Math.max(0, (container.clientWidth - canvasWidth) / 2),
        y: Math.max(0, (container.clientHeight - canvasHeight) / 2),
      })
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden bg-[#1a1a1a] relative"
      onMouseMove={(e) => {
        if (isPanning) {
          setPanOffset({
            x: e.clientX - panStart.x,
            y: e.clientY - panStart.y,
          })
        }
      }}
      onMouseDown={(e) => {
        // Middle mouse button starts panning from anywhere
        if (e.button === 1) {
          e.preventDefault()
          setIsPanning(true)
          setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
        }
      }}
      onMouseUp={(e) => {
        handleMouseUp()
        if (e.button === 1) {
          setIsPanning(false)
        }
      }}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Infinite canvas background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle, #666 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Canvas wrapper for panning */}
      <div
        ref={canvasRef}
        className="absolute"
        style={{
          left: panOffset.x,
          top: panOffset.y,
          width: width * cellSize,
          height: height * cellSize,
          cursor: getCursor(),
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Shadow */}
        <div
          className="absolute -inset-2 bg-black/20 rounded-lg blur-xl -z-10"
          style={{ transform: "translateY(4px)" }}
        />

        {/* Map canvas */}
        <div
          className="relative bg-muted rounded overflow-hidden"
          style={{
            width: width * cellSize,
            height: height * cellSize,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
          }}
        >
          {/* Terrain Grid */}
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
            }}
          >
            {cells.map((row, y) =>
              row.map((cell, x) => {
                const region = getRegionForCell(x, y)
                const isInSelectedRegion = selectedRegion && region?.id === selectedRegion
                const isInLasso = lassoPoints.some((p) => p.x === x && p.y === y)
                const isSelectedCell = selectedCell?.x === x && selectedCell?.y === y
                const elevation = cell.elevation ?? 0

                // Calculate brightness based on elevation
                // elevation 0 = base color, negative = darker, positive = brighter
                const brightnessAdjust = elevation * 8 // 8% per elevation level
                const filterValue = elevation === 0
                  ? "none"
                  : `brightness(${100 + brightnessAdjust}%)`

                return (
                  <div
                    key={`${x}-${y}`}
                    className={cn(
                      "transition-colors relative",
                      showGrid && "border border-black/10",
                      activeTool === "paint" && selectedTerrain && "hover:brightness-110",
                      activeTool === "select" && "hover:ring-2 hover:ring-inset hover:ring-white/50 cursor-pointer",
                      isInLasso && "ring-2 ring-inset ring-blue-500",
                      isSelectedCell && "ring-2 ring-inset ring-yellow-400"
                    )}
                    style={{
                      backgroundColor: getTerrainColor(cell.terrain),
                      filter: filterValue,
                    }}
                    onMouseDown={(e) => handleMouseDown(x, y, e)}
                    onMouseEnter={(e) => handleMouseMove(x, y, e)}
                    onClick={() => {
                      if (activeTool === "select") {
                        onCellSelect(x, y)
                      }
                    }}
                  >
                    {/* Region overlay */}
                    {showRegionOverlay && region && (
                      <div
                        className={cn(
                          "absolute inset-0 pointer-events-none transition-opacity",
                          isInSelectedRegion && "ring-2 ring-inset ring-white"
                        )}
                        style={{
                          backgroundColor: region.color,
                          opacity: isInSelectedRegion ? 0.6 : 0.35,
                        }}
                      />
                    )}
                    {/* Elevation indicator */}
                    {showElevation && elevation !== 0 && (
                      <div
                        className={cn(
                          "absolute inset-0 pointer-events-none flex items-center justify-center",
                          elevation > 0 ? "text-white" : "text-blue-200"
                        )}
                        style={{
                          backgroundColor: elevation > 0
                            ? `rgba(0, 0, 0, ${Math.min(0.5, elevation * 0.15)})`
                            : `rgba(0, 50, 150, ${Math.min(0.5, Math.abs(elevation) * 0.2)})`,
                        }}
                      >
                        {cellSize >= 24 && (
                          <span
                            className="font-bold drop-shadow-md"
                            style={{ fontSize: Math.max(8, cellSize * 0.35) }}
                          >
                            {elevation > 0 ? `+${elevation}` : elevation}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Selected cell highlight */}
                    {isSelectedCell && (
                      <div className="absolute inset-0 pointer-events-none bg-yellow-400/20" />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Lasso outline */}
          {isLassoing && lassoPoints.length > 1 && (
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: width * cellSize, height: height * cellSize }}
            >
              <polyline
                points={lassoPoints
                  .map((p) => `${p.x * cellSize + cellSize / 2},${p.y * cellSize + cellSize / 2}`)
                  .join(" ")}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="6 3"
              />
              <polygon
                points={lassoPoints
                  .map((p) => `${p.x * cellSize + cellSize / 2},${p.y * cellSize + cellSize / 2}`)
                  .join(" ")}
                fill="rgba(59, 130, 246, 0.15)"
                stroke="none"
              />
            </svg>
          )}

          {/* POIs Layer */}
          {pois.map((poi) => (
            <div
              key={poi.id}
              draggable
              onDragStart={(e) => handlePOIDragStart(e, poi)}
              onClick={(e) => {
                e.stopPropagation()
                onPOISelect(poi)
              }}
              className={cn(
                "absolute cursor-grab active:cursor-grabbing transition-all flex flex-col items-center justify-center",
                "bg-background/90 backdrop-blur-sm rounded shadow-lg border-2",
                selectedPlacedPOI?.id === poi.id
                  ? "border-blue-500 ring-2 ring-blue-500/30 z-10 scale-105"
                  : "border-white/20 hover:border-white/40 hover:scale-102"
              )}
              style={{
                left: poi.x * cellSize,
                top: poi.y * cellSize,
                width: poi.size.w * cellSize,
                height: poi.size.h * cellSize,
                fontSize: Math.min(poi.size.w, poi.size.h) * cellSize * 0.45,
              }}
              title={poi.name}
            >
              <span className="select-none drop-shadow">{poi.icon}</span>
              {cellSize >= 20 && (
                <span
                  className="font-medium text-center leading-tight truncate max-w-full px-1"
                  style={{ fontSize: Math.max(8, Math.min(12, cellSize * 0.3)) }}
                >
                  {poi.name}
                </span>
              )}
            </div>
          ))}

          {/* Association Lines Layer */}
          {showAssociations && (
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: width * cellSize, height: height * cellSize }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="currentColor" className="text-violet-400" />
                </marker>
              </defs>
              {/* Lines from POIs to their associated narrative beats */}
              {pois.map((poi) =>
                poi.narrativeAssociations?.map((assoc, idx) => {
                  const matchingBeat = narrativeBeats.find(
                    (b) => b.sectionId === assoc.sectionId && b.nodeId === assoc.nodeId
                  )
                  if (!matchingBeat) return null

                  const poiCenterX = (poi.x + poi.size.w / 2) * cellSize
                  const poiCenterY = (poi.y + poi.size.h / 2) * cellSize
                  const beatCenterX = (matchingBeat.x + (matchingBeat.type === "section" ? 1 : 0.75)) * cellSize
                  const beatCenterY = (matchingBeat.y + (matchingBeat.type === "section" ? 1 : 0.75)) * cellSize

                  const isHighlighted =
                    selectedPlacedPOI?.id === poi.id ||
                    selectedNarrativeBeat?.id === matchingBeat.id

                  return (
                    <line
                      key={`poi-${poi.id}-assoc-${idx}`}
                      x1={poiCenterX}
                      y1={poiCenterY}
                      x2={beatCenterX}
                      y2={beatCenterY}
                      stroke={isHighlighted ? "#a78bfa" : "#8b5cf6"}
                      strokeWidth={isHighlighted ? 3 : 1.5}
                      strokeDasharray={isHighlighted ? "none" : "4 4"}
                      strokeOpacity={isHighlighted ? 1 : 0.5}
                      markerEnd="url(#arrowhead)"
                    />
                  )
                })
              )}
              {/* Lines from narrative beats to their associated POIs */}
              {narrativeBeats.map((beat) =>
                beat.associatedPOIs?.map((poiId) => {
                  const poi = pois.find((p) => p.id === poiId)
                  if (!poi) return null

                  // Skip if already drawn from POI side
                  const alreadyDrawn = poi.narrativeAssociations?.some(
                    (a) => a.sectionId === beat.sectionId && a.nodeId === beat.nodeId
                  )
                  if (alreadyDrawn) return null

                  const beatCenterX = (beat.x + (beat.type === "section" ? 1 : 0.75)) * cellSize
                  const beatCenterY = (beat.y + (beat.type === "section" ? 1 : 0.75)) * cellSize
                  const poiCenterX = (poi.x + poi.size.w / 2) * cellSize
                  const poiCenterY = (poi.y + poi.size.h / 2) * cellSize

                  const isHighlighted =
                    selectedPlacedPOI?.id === poi.id ||
                    selectedNarrativeBeat?.id === beat.id

                  return (
                    <line
                      key={`beat-${beat.id}-poi-${poiId}`}
                      x1={beatCenterX}
                      y1={beatCenterY}
                      x2={poiCenterX}
                      y2={poiCenterY}
                      stroke={isHighlighted ? "#a78bfa" : "#8b5cf6"}
                      strokeWidth={isHighlighted ? 3 : 1.5}
                      strokeDasharray={isHighlighted ? "none" : "4 4"}
                      strokeOpacity={isHighlighted ? 1 : 0.5}
                      markerEnd="url(#arrowhead)"
                    />
                  )
                })
              )}
            </svg>
          )}

          {/* Narrative Beats Layer */}
          {narrativeBeats.map((beat) => (
            <div
              key={beat.id}
              draggable
              onDragStart={(e) => handleBeatDragStart(e, beat)}
              onClick={(e) => {
                e.stopPropagation()
                onNarrativeBeatSelect(beat)
              }}
              className={cn(
                "absolute cursor-grab active:cursor-grabbing transition-all flex flex-col items-center justify-center",
                "rounded shadow-lg border-2",
                beat.type === "section"
                  ? "bg-amber-500/90 backdrop-blur-sm"
                  : "bg-sky-500/90 backdrop-blur-sm",
                selectedNarrativeBeat?.id === beat.id
                  ? "border-white ring-2 ring-white/50 z-20 scale-105"
                  : "border-white/30 hover:border-white/60 hover:scale-102"
              )}
              style={{
                left: beat.x * cellSize,
                top: beat.y * cellSize,
                width: beat.type === "section" ? cellSize * 2 : cellSize * 1.5,
                height: beat.type === "section" ? cellSize * 2 : cellSize * 1.5,
                fontSize: beat.type === "section" ? cellSize * 0.5 : cellSize * 0.4,
              }}
              title={`${beat.type === "section" ? "Section" : "Node"}: ${beat.name}`}
            >
              <span className="select-none drop-shadow text-white">
                {beat.type === "section" ? "📖" : "💬"}
              </span>
              {cellSize >= 20 && (
                <span
                  className="font-medium text-center leading-tight truncate max-w-full px-1 text-white"
                  style={{ fontSize: Math.max(8, Math.min(11, cellSize * 0.28)) }}
                >
                  {beat.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tool hints */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-muted-foreground border max-w-xs">
        {activeTool === "pan" && "Click and drag to pan the canvas"}
        {activeTool === "select" && "Click on cells or elements to select them"}
        {activeTool === "lasso" && "Click and drag to draw a region selection"}
        {activeTool === "paint" && selectedTerrain && `Painting: ${selectedTerrain.name}`}
        {activeTool === "paint" && !selectedTerrain && "Select a terrain type from the left panel"}
        {activeTool === "poi" && selectedPOI && `Placing: ${selectedPOI.name}`}
        {activeTool === "poi" && !selectedPOI && "Select a POI type from the left panel"}
        {isSpacePanning && <span className="text-primary font-medium">Space held - drag to pan</span>}
      </div>

      {/* Navigation hints */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-muted-foreground border flex items-center gap-3">
        <span>Scroll to pan</span>
        <span className="text-muted-foreground/50">|</span>
        <span>Space+drag to pan</span>
        <span className="text-muted-foreground/50">|</span>
        <span>Middle-click to pan</span>
      </div>

      {/* Coordinates display */}
      <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-mono border">
        {width} x {height} tiles | Zoom: {Math.round(zoom * 100)}%
      </div>
    </div>
  )
}
