"use client"

import React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  type MapCell,
  type PlacedPOI,
  type TerrainType,
  type POIItem,
  type NamedRegion,
  type NarrativeSchema,
  type PlacedNarrativeBeat,
  type NarrativeAssociation,
  terrainElevations,
  naturalTerrains,
  humanMadeTerrains,
  poiCategories,
} from "../lib/terrain-types"
import { generatePOIName, generateRegionName } from "../lib/name-generator"
import { useHistory } from "../hooks/use-history"
import { useHotkeys } from "../hooks/use-hotkeys"
import { useMapStore } from "../lib/map-store"
import { useContainerSize } from "@dnd-agent/ui/hooks/use-container-size"
import { EditorToolbar, type EditorTool } from "./editor-toolbar"
  import { LeftPanel } from "./left-panel"
  import { RightPanel } from "./right-panel"
  import { MapCanvas } from "./map-canvas"
  import { MapViewer3D } from "./map-viewer-3d"

const DEFAULT_WIDTH = 20
const DEFAULT_HEIGHT = 15
const DEFAULT_TERRAIN = "grass"

const regionColors = [
  "rgba(239, 68, 68, 0.5)",
  "rgba(34, 197, 94, 0.5)",
  "rgba(59, 130, 246, 0.5)",
  "rgba(168, 85, 247, 0.5)",
  "rgba(249, 115, 22, 0.5)",
  "rgba(236, 72, 153, 0.5)",
  "rgba(20, 184, 166, 0.5)",
  "rgba(234, 179, 8, 0.5)",
]

interface EditorState {
  cells: MapCell[][]
  pois: PlacedPOI[]
  regions: NamedRegion[]
  narrativeBeats: PlacedNarrativeBeat[]
  /** Tile the player loads into when entering the map. */
  spawn?: { x: number; y: number }
}

function createEmptyMap(width: number, height: number): MapCell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      terrain: DEFAULT_TERRAIN,
      elevation: terrainElevations[DEFAULT_TERRAIN] || 0,
    }))
  )
}

function createInitialState(width: number, height: number): EditorState {
  return {
    cells: createEmptyMap(width, height),
    pois: [],
    regions: [],
    narrativeBeats: [],
  }
}

export function MapEditor() {
  const [mapWidth, setMapWidth] = useState(DEFAULT_WIDTH)
  const [mapHeight, setMapHeight] = useState(DEFAULT_HEIGHT)
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType | null>(null)
  const [selectedPOI, setSelectedPOI] = useState<POIItem | null>(null)
  const [selectedPlacedPOI, setSelectedPlacedPOI] = useState<PlacedPOI | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<EditorTool>("select")
  const [zoom, setZoom] = useState(1)
  const [brushSize, setBrushSize] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [showRegionOverlay, setShowRegionOverlay] = useState(true)
  const [showAssociations, setShowAssociations] = useState(true)
  const [showElevation, setShowElevation] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null)
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d")

  // Responsive container sizing
  const containerRef = useRef<HTMLDivElement>(null)
  const { width: containerWidth } = useContainerSize(containerRef)

  // Auto-collapse breakpoints with manual override
  const [leftPanelPinned, setLeftPanelPinned] = useState<boolean | null>(null)
  const [rightPanelPinned, setRightPanelPinned] = useState<boolean | null>(null)

  const autoLeftCollapsed = containerWidth > 0 && containerWidth < 900
  const autoRightCollapsed = containerWidth > 0 && containerWidth < 700

  const isLeftCollapsed = leftPanelPinned !== null ? !leftPanelPinned : autoLeftCollapsed
  const isRightCollapsed = rightPanelPinned !== null ? !rightPanelPinned : autoRightCollapsed
  const isCompactToolbar = containerWidth > 0 && containerWidth < 700

  // Reset pin state when crossing breakpoint boundaries
  const prevAutoLeftRef = useRef(autoLeftCollapsed)
  const prevAutoRightRef = useRef(autoRightCollapsed)
  useEffect(() => {
    if (prevAutoLeftRef.current !== autoLeftCollapsed) {
      setLeftPanelPinned(null)
      prevAutoLeftRef.current = autoLeftCollapsed
    }
    if (prevAutoRightRef.current !== autoRightCollapsed) {
      setRightPanelPinned(null)
      prevAutoRightRef.current = autoRightCollapsed
    }
  }, [autoLeftCollapsed, autoRightCollapsed])

  // History management
  const {
    state: editorState,
    set: setEditorState,
    undo,
    redo,
    reset: resetHistory,
    canUndo,
    canRedo,
    historyLength,
    futureLength,
  } = useHistory<EditorState>(createInitialState(DEFAULT_WIDTH, DEFAULT_HEIGHT))

  const { cells, pois, regions, narrativeBeats } = editorState

  // Narrative schema is fed live by the story boarder via useMapStore.
  const narrativeSchema = useMapStore((s) => s.narrativeSchema) as NarrativeSchema | null
  const [selectedNarrativeBeat, setSelectedNarrativeBeat] = useState<PlacedNarrativeBeat | null>(null)

  // Hotkey configuration
  useHotkeys([
    { key: "z", ctrl: true, action: undo, description: "Undo" },
    { key: "z", ctrl: true, shift: true, action: redo, description: "Redo" },
    { key: "y", ctrl: true, action: redo, description: "Redo" },
    { key: "v", action: () => setActiveTool("select"), description: "Select tool" },
    { key: "h", action: () => setActiveTool("pan"), description: "Pan tool" },
    { key: "b", action: () => setActiveTool("paint"), description: "Brush tool" },
    { key: "p", action: () => setActiveTool("poi"), description: "POI tool" },
    { key: "l", action: () => setActiveTool("lasso"), description: "Lasso tool" },
    { key: "g", action: () => setShowGrid((s) => !s), description: "Toggle grid" },
    { key: "r", action: () => setShowRegionOverlay((s) => !s), description: "Toggle regions" },
    { key: "a", action: () => setShowAssociations((s) => !s), description: "Toggle associations" },
    { key: "e", action: () => setShowElevation((s) => !s), description: "Toggle elevation" },
    { key: "=", ctrl: true, action: () => setZoom((z) => Math.min(3, z + 0.1)), description: "Zoom in" },
    { key: "-", ctrl: true, action: () => setZoom((z) => Math.max(0.25, z - 0.1)), description: "Zoom out" },
    { key: "0", ctrl: true, action: () => setZoom(1), description: "Reset zoom" },
    {
      key: "Delete",
      action: () => {
        if (selectedPlacedPOI) handlePOIDelete(selectedPlacedPOI.id)
        else if (selectedRegion) handleRegionDelete(selectedRegion)
        else if (selectedNarrativeBeat) handleNarrativeBeatDelete(selectedNarrativeBeat.id)
      },
      description: "Delete selected",
    },
    {
      key: "Backspace",
      action: () => {
        if (selectedPlacedPOI) handlePOIDelete(selectedPlacedPOI.id)
        else if (selectedRegion) handleRegionDelete(selectedRegion)
        else if (selectedNarrativeBeat) handleNarrativeBeatDelete(selectedNarrativeBeat.id)
      },
      description: "Delete selected",
    },
    { key: "Escape", action: () => { setSelectedPlacedPOI(null); setSelectedRegion(null); setSelectedNarrativeBeat(null) }, description: "Deselect" },
    { key: "1", action: () => setBrushSize(1), description: "Brush size 1" },
    { key: "2", action: () => setBrushSize(2), description: "Brush size 2" },
    { key: "3", action: () => setBrushSize(3), description: "Brush size 3" },
    { key: "4", action: () => setBrushSize(4), description: "Brush size 4" },
    { key: "5", action: () => setBrushSize(5), description: "Brush size 5" },
  ])

  const handleTerrainSelect = (terrain: TerrainType | null) => {
    setSelectedTerrain(terrain)
    setSelectedPOI(null)
    setSelectedPlacedPOI(null)
    if (terrain) setActiveTool("paint")
  }

  const handlePOISelect = (poi: POIItem | null) => {
    setSelectedPOI(poi)
    setSelectedTerrain(null)
    setSelectedPlacedPOI(null)
    if (poi) setActiveTool("poi")
  }

  const handleToolChange = (tool: EditorTool) => {
    setActiveTool(tool)
    if (tool === "lasso" || tool === "select" || tool === "pan") {
      setSelectedTerrain(null)
      setSelectedPOI(null)
    }
  }

  const paintCell = useCallback(
    (centerX: number, centerY: number) => {
      if (!selectedTerrain) return

      setEditorState((prev) => {
        const newCells = prev.cells.map((row) => row.map((cell) => ({ ...cell })))
        const offset = Math.floor(brushSize / 2)

        for (let dy = -offset; dy <= offset; dy++) {
          for (let dx = -offset; dx <= offset; dx++) {
            const x = centerX + dx
            const y = centerY + dy
            if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
              // Always use the selected terrain's baseElevation, overriding any existing value
              const newElevation = selectedTerrain.baseElevation
              newCells[y][x].terrain = selectedTerrain.id
              newCells[y][x].elevation = newElevation
              newCells[y][x].elevationOffset = 0 // Reset offset when painting new terrain
            }
          }
        }
        return { ...prev, cells: newCells }
      })
    },
    [selectedTerrain, brushSize, mapWidth, mapHeight, setEditorState]
  )

  const handleCellClick = (x: number, y: number) => {
    if (activeTool === "poi" && selectedPOI) {
      const generatedName = generatePOIName(selectedPOI.id)
      const newPOI: PlacedPOI = {
        id: `poi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: selectedPOI.id,
        name: generatedName,
        icon: selectedPOI.icon,
        x,
        y,
        size: selectedPOI.size,
      }
      setEditorState((prev) => ({ ...prev, pois: [...prev.pois, newPOI] }))
      setSelectedPlacedPOI(newPOI)
    } else if (activeTool === "paint") {
      paintCell(x, y)
    } else if (activeTool === "select") {
      // Select cell for elevation editing
      setSelectedCell({ x, y })
      setSelectedPlacedPOI(null)
      setSelectedRegion(null)
      setSelectedNarrativeBeat(null)
    }
  }

  const handleCellSelect = (x: number, y: number) => {
    setSelectedCell({ x, y })
    setSelectedPlacedPOI(null)
    setSelectedRegion(null)
    setSelectedNarrativeBeat(null)
  }

  const handleCellElevationChange = (x: number, y: number, newElevation: number) => {
    setEditorState((prev) => {
      const newCells = prev.cells.map((row) => row.map((cell) => ({ ...cell })))
      const baseElevation = terrainElevations[newCells[y][x].terrain] || 0
      newCells[y][x].elevation = newElevation
      newCells[y][x].elevationOffset = newElevation - baseElevation
      return { ...prev, cells: newCells }
    })
  }

  const handlePOIDrop = (poi: POIItem, x: number, y: number) => {
    const generatedName = generatePOIName(poi.id)
    const newPOI: PlacedPOI = {
      id: `poi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: poi.id,
      name: generatedName,
      icon: poi.icon,
      x: Math.min(x, mapWidth - poi.size.w),
      y: Math.min(y, mapHeight - poi.size.h),
      size: poi.size,
    }
    setEditorState((prev) => ({ ...prev, pois: [...prev.pois, newPOI] }))
    setSelectedPlacedPOI(newPOI)
  }

  const handlePOIMove = (poiId: string, x: number, y: number) => {
    setEditorState((prev) => ({
      ...prev,
      pois: prev.pois.map((poi) => {
        if (poi.id === poiId) {
          return {
            ...poi,
            x: Math.max(0, Math.min(x, mapWidth - poi.size.w)),
            y: Math.max(0, Math.min(y, mapHeight - poi.size.h)),
          }
        }
        return poi
      }),
    }))
  }

  const handlePOIDelete = (poiId: string) => {
    setEditorState((prev) => ({
      ...prev,
      pois: prev.pois.filter((poi) => poi.id !== poiId),
    }))
    if (selectedPlacedPOI?.id === poiId) {
      setSelectedPlacedPOI(null)
    }
  }

  const handlePOIRename = (poiId: string, newName: string) => {
    setEditorState(
      (prev) => ({
        ...prev,
        pois: prev.pois.map((poi) => (poi.id === poiId ? { ...poi, name: newName } : poi)),
      }),
      false // Don't record name changes in history
    )
    if (selectedPlacedPOI?.id === poiId) {
      setSelectedPlacedPOI((prev) => (prev ? { ...prev, name: newName } : null))
    }
  }

  const handlePlacedPOISelect = (poi: PlacedPOI | null) => {
    setSelectedPlacedPOI(poi)
    setSelectedRegion(null)
    setSelectedTerrain(null)
    setSelectedPOI(null)
    if (poi) setActiveTool("select")
  }

  const handleLassoComplete = (pixels: { x: number; y: number }[]) => {
    if (pixels.length === 0) return

    const terrainCounts: Record<string, number> = {}
    for (const pixel of pixels) {
      if (pixel.y < cells.length && pixel.x < cells[0].length) {
        const terrain = cells[pixel.y][pixel.x].terrain
        terrainCounts[terrain] = (terrainCounts[terrain] || 0) + 1
      }
    }
    const dominantTerrain = Object.entries(terrainCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

    const newRegion: NamedRegion = {
      id: `region-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: generateRegionName(dominantTerrain),
      color: regionColors[regions.length % regionColors.length],
      pixels,
    }

    setEditorState((prev) => ({ ...prev, regions: [...prev.regions, newRegion] }))
    setSelectedRegion(newRegion.id)
  }

  const handleRegionRename = (regionId: string, newName: string) => {
    setEditorState(
      (prev) => ({
        ...prev,
        regions: prev.regions.map((r) => (r.id === regionId ? { ...r, name: newName } : r)),
      }),
      false
    )
  }

  const handleRegionDelete = (regionId: string) => {
    setEditorState((prev) => ({
      ...prev,
      regions: prev.regions.filter((r) => r.id !== regionId),
    }))
    if (selectedRegion === regionId) {
      setSelectedRegion(null)
    }
  }

  const handleRegionSelect = (regionId: string | null) => {
    setSelectedRegion(regionId)
    setSelectedPlacedPOI(null)
    setSelectedNarrativeBeat(null)
  }

  // Narrative beat handlers
  const handleNarrativeBeatDrop = (
    beat: { sectionId: string; nodeId?: string; type: "section" | "node"; name: string },
    x: number,
    y: number
  ) => {
    const newBeat: PlacedNarrativeBeat = {
      id: `beat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sectionId: beat.sectionId,
      nodeId: beat.nodeId,
      name: beat.name,
      x,
      y,
      type: beat.type,
    }
    setEditorState((prev) => ({ ...prev, narrativeBeats: [...prev.narrativeBeats, newBeat] }))
    setSelectedNarrativeBeat(newBeat)
  }

  const handleNarrativeBeatMove = (beatId: string, x: number, y: number) => {
    setEditorState((prev) => ({
      ...prev,
      narrativeBeats: prev.narrativeBeats.map((beat) => {
        if (beat.id === beatId) {
          return { ...beat, x: Math.max(0, x), y: Math.max(0, y) }
        }
        return beat
      }),
    }))
  }

  const handleNarrativeBeatSelect = (beat: PlacedNarrativeBeat | null) => {
    setSelectedNarrativeBeat(beat)
    setSelectedPlacedPOI(null)
    setSelectedRegion(null)
  }

  const handleNarrativeBeatRename = (beatId: string, newName: string) => {
    setEditorState(
      (prev) => ({
        ...prev,
        narrativeBeats: prev.narrativeBeats.map((b) => (b.id === beatId ? { ...b, name: newName } : b)),
      }),
      false
    )
    if (selectedNarrativeBeat?.id === beatId) {
      setSelectedNarrativeBeat((prev) => (prev ? { ...prev, name: newName } : null))
    }
  }

  const handleNarrativeBeatDelete = (beatId: string) => {
    setEditorState((prev) => ({
      ...prev,
      narrativeBeats: prev.narrativeBeats.filter((b) => b.id !== beatId),
    }))
    if (selectedNarrativeBeat?.id === beatId) {
      setSelectedNarrativeBeat(null)
    }
  }

  // Association handlers
  const handleUpdatePOIAssociations = (poiId: string, associations: NarrativeAssociation[]) => {
    setEditorState((prev) => ({
      ...prev,
      pois: prev.pois.map((poi) =>
        poi.id === poiId ? { ...poi, narrativeAssociations: associations } : poi
      ),
    }))
    if (selectedPlacedPOI?.id === poiId) {
      setSelectedPlacedPOI((prev) =>
        prev ? { ...prev, narrativeAssociations: associations } : null
      )
    }
  }

  const handleUpdateBeatAssociations = (beatId: string, poiIds: string[]) => {
    setEditorState((prev) => ({
      ...prev,
      narrativeBeats: prev.narrativeBeats.map((beat) =>
        beat.id === beatId ? { ...beat, associatedPOIs: poiIds } : beat
      ),
    }))
    if (selectedNarrativeBeat?.id === beatId) {
      setSelectedNarrativeBeat((prev) =>
        prev ? { ...prev, associatedPOIs: poiIds } : null
      )
    }
  }

  const handleUpdatePOIGltfUrl = (poiId: string, gltfUrl: string | undefined) => {
    setEditorState((prev) => ({
      ...prev,
      pois: prev.pois.map((poi) =>
        poi.id === poiId ? { ...poi, gltfUrl } : poi
      ),
    }))
    if (selectedPlacedPOI?.id === poiId) {
      setSelectedPlacedPOI((prev) =>
        prev ? { ...prev, gltfUrl } : null
      )
    }
  }

  const handleResizeMap = (newWidth: number, newHeight: number) => {
    setMapWidth(newWidth)
    setMapHeight(newHeight)
    setEditorState((prev) => {
      const newCells = createEmptyMap(newWidth, newHeight)
      for (let y = 0; y < Math.min(prev.cells.length, newHeight); y++) {
        for (let x = 0; x < Math.min(prev.cells[0].length, newWidth); x++) {
          newCells[y][x] = prev.cells[y][x]
        }
      }
      return {
        cells: newCells,
        pois: prev.pois.filter(
          (poi) => poi.x + poi.size.w <= newWidth && poi.y + poi.size.h <= newHeight
        ),
        regions: prev.regions
          .map((r) => ({
            ...r,
            pixels: r.pixels.filter((p) => p.x < newWidth && p.y < newHeight),
          }))
          .filter((r) => r.pixels.length > 0),
      }
    })
  }

  const handleClear = () => {
    resetHistory(createInitialState(mapWidth, mapHeight))
    setSelectedPlacedPOI(null)
    setSelectedRegion(null)
    setSelectedNarrativeBeat(null)
  }

  // ─────────────────────────────────────────────
  // DM prep agent integration: consume pending mutations
  // and publish a snapshot of the current map for the agent.
  // ─────────────────────────────────────────────
  const pendingMutations = useMapStore((s) => s.pendingMutations)
  const consumeMutations = useMapStore((s) => s.consumeMutations)
  const publishSnapshot = useMapStore((s) => s.publishSnapshot)
  const publishExportSnapshot = useMapStore((s) => s.publishExportSnapshot)

  useEffect(() => {
    if (pendingMutations.length === 0) return

    const allTerrains = [...naturalTerrains, ...humanMadeTerrains]
    const findTerrain = (id: string) => allTerrains.find((t) => t.id === id)
    const allPOIItems = poiCategories.flatMap((c) => c.items as readonly POIItem[])
    const findPOI = (id: string) => allPOIItems.find((p) => p.id === id)

    for (const m of pendingMutations) {
      if (m.type === "set_dimensions") {
        if (m.reset) {
          setMapWidth(m.width)
          setMapHeight(m.height)
          resetHistory(createInitialState(m.width, m.height))
        } else {
          handleResizeMap(m.width, m.height)
        }
      } else if (m.type === "paint_rect") {
        const t = findTerrain(m.terrain)
        if (!t) continue
        setEditorState((prev) => {
          const newCells = prev.cells.map((row) => row.map((cell) => ({ ...cell })))
          const w = newCells[0]?.length ?? 0
          const h = newCells.length
          const x1 = Math.max(0, Math.min(m.x1, m.x2))
          const x2 = Math.min(w - 1, Math.max(m.x1, m.x2))
          const y1 = Math.max(0, Math.min(m.y1, m.y2))
          const y2 = Math.min(h - 1, Math.max(m.y1, m.y2))
          for (let y = y1; y <= y2; y++) {
            for (let x = x1; x <= x2; x++) {
              if (newCells[y]?.[x]) {
                newCells[y][x].terrain = t.id
                newCells[y][x].elevation = t.baseElevation
                newCells[y][x].elevationOffset = 0
              }
            }
          }
          return { ...prev, cells: newCells }
        })
      } else if (m.type === "add_poi") {
        const p = findPOI(m.poiType)
        if (!p) continue
        setEditorState((prev) => {
          const w = prev.cells[0]?.length ?? 0
          const h = prev.cells.length
          const newPOI: PlacedPOI = {
            id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            type: p.id,
            name: m.name,
            icon: p.icon,
            x: Math.max(0, Math.min(m.x, w - p.size.w)),
            y: Math.max(0, Math.min(m.y, h - p.size.h)),
            size: p.size,
          }
          return { ...prev, pois: [...prev.pois, newPOI] }
        })
      } else if (m.type === "set_spawn") {
        setEditorState((prev) => {
          const w = prev.cells[0]?.length ?? 0
          const h = prev.cells.length
          const x = Math.max(0, Math.min(m.x, w - 1))
          const y = Math.max(0, Math.min(m.y, h - 1))
          return { ...prev, spawn: { x, y } }
        })
      } else if (m.type === "place_beat") {
        setEditorState((prev) => {
          const w = prev.cells[0]?.length ?? 0
          const h = prev.cells.length
          const x = Math.max(0, Math.min(m.x, w - 1))
          const y = Math.max(0, Math.min(m.y, h - 1))
          const newBeat: PlacedNarrativeBeat = {
            id: `beat-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            sectionId: m.sectionName,
            nodeId: m.nodeId,
            name: m.name,
            x,
            y,
            type: m.nodeId ? "node" : "section",
            radius: typeof m.radius === "number" ? Math.max(0, m.radius) : 1,
            oneShot: m.oneShot ?? true,
          }
          return { ...prev, narrativeBeats: [...prev.narrativeBeats, newBeat] }
        })
      } else if (m.type === "clear") {
        resetHistory(createInitialState(mapWidth, mapHeight))
      }
    }

    consumeMutations()
    // We intentionally only re-run when the queue itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMutations])

  useEffect(() => {
    publishSnapshot({
      width: mapWidth,
      height: mapHeight,
      poiCount: pois.length,
      poiSummary: pois.map((p) => ({ type: p.type, name: p.name, x: p.x, y: p.y })),
      spawn: editorState.spawn,
      beats: narrativeBeats.map((b) => ({
        id: b.id,
        sectionName: b.sectionId,
        nodeId: b.nodeId,
        name: b.name,
        x: b.x,
        y: b.y,
        radius: typeof b.radius === "number" ? b.radius : 1,
        oneShot: b.oneShot ?? true,
      })),
    })
  }, [mapWidth, mapHeight, pois, narrativeBeats, editorState.spawn, publishSnapshot])

  useEffect(() => {
    publishExportSnapshot({
      width: mapWidth,
      height: mapHeight,
      cells: cells.map((row) =>
        row.map((cell) => ({
          terrain: cell.terrain,
          elevation: cell.elevation,
          elevationOffset: cell.elevationOffset,
          regionId: cell.regionId,
        })),
      ),
      pois: pois.map((p) => ({
        id: p.id,
        type: p.type,
        name: p.name,
        icon: p.icon,
        x: p.x,
        y: p.y,
        size: p.size,
        gltfUrl: p.gltfUrl,
      })),
      regions: regions.map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        pixels: r.pixels,
      })),
      spawn: editorState.spawn,
      beats: narrativeBeats.map((b) => ({
        id: b.id,
        sectionId: b.sectionId,
        nodeId: b.nodeId,
        name: b.name,
        x: b.x,
        y: b.y,
        radius: b.radius,
        oneShot: b.oneShot,
      })),
    })
  }, [mapWidth, mapHeight, cells, pois, regions, narrativeBeats, editorState.spawn, publishExportSnapshot])

  const selectedRegionData = selectedRegion ? regions.find((r) => r.id === selectedRegion) || null : null

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-background">
      {/* View Mode Toggle */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center bg-background/95 backdrop-blur-sm rounded-full border shadow-lg p-1">
          <button
            onClick={() => setViewMode("2d")}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              viewMode === "2d"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            2D
          </button>
          <button
            onClick={() => setViewMode("3d")}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              viewMode === "3d"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            3D
          </button>
        </div>
      </div>

      {/* Top Toolbar */}
      <EditorToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3, z + 0.1))}
        onZoomOut={() => setZoom((z) => Math.max(0.25, z - 0.1))}
        onZoomReset={() => setZoom(1)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((s) => !s)}
        showRegions={showRegionOverlay}
        onToggleRegions={() => setShowRegionOverlay((s) => !s)}
        showAssociations={showAssociations}
        onToggleAssociations={() => setShowAssociations((s) => !s)}
        showElevation={showElevation}
        onToggleElevation={() => setShowElevation((s) => !s)}
        onClear={handleClear}
        historyLength={historyLength}
        futureLength={futureLength}
        compact={isCompactToolbar}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel */}
        <LeftPanel
          activeTool={activeTool}
          selectedTerrain={selectedTerrain}
          onSelectTerrain={handleTerrainSelect}
          selectedPOI={selectedPOI}
          onSelectPOI={handlePOISelect}
          pois={pois}
          selectedPlacedPOI={selectedPlacedPOI}
          onSelectPlacedPOI={handlePlacedPOISelect}
          onRenamePOI={handlePOIRename}
          onDeletePOI={handlePOIDelete}
          regions={regions}
          selectedRegion={selectedRegion}
          onSelectRegion={handleRegionSelect}
          onRenameRegion={handleRegionRename}
          onDeleteRegion={handleRegionDelete}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          narrativeSchema={narrativeSchema}
          placedBeats={narrativeBeats}
          selectedBeat={selectedNarrativeBeat}
          onSelectBeat={handleNarrativeBeatSelect}
          onRenameBeat={handleNarrativeBeatRename}
          onDeleteBeat={handleNarrativeBeatDelete}
          collapsed={isLeftCollapsed}
        />

{/* Canvas - 2D or 3D */}
  {viewMode === "2d" ? (
    <MapCanvas
      width={mapWidth}
      height={mapHeight}
      cells={cells}
      pois={pois}
      regions={regions}
      narrativeBeats={narrativeBeats}
      selectedTerrain={selectedTerrain}
      selectedPOI={selectedPOI}
      activeTool={activeTool}
      onCellClick={handleCellClick}
      onCellDrag={paintCell}
      onPOIDrop={handlePOIDrop}
      onPOIMove={handlePOIMove}
      onPOISelect={handlePlacedPOISelect}
      onPOIDelete={handlePOIDelete}
      onLassoComplete={handleLassoComplete}
      onNarrativeBeatDrop={handleNarrativeBeatDrop}
      onNarrativeBeatMove={handleNarrativeBeatMove}
      onNarrativeBeatSelect={handleNarrativeBeatSelect}
      selectedPlacedPOI={selectedPlacedPOI}
      selectedNarrativeBeat={selectedNarrativeBeat}
      selectedRegion={selectedRegion}
      zoom={zoom}
      showGrid={showGrid}
      showRegionOverlay={showRegionOverlay}
      showAssociations={showAssociations}
      showElevation={showElevation}
      selectedCell={selectedCell}
      onCellSelect={handleCellSelect}
    />
  ) : (
    <MapViewer3D
      width={mapWidth}
      height={mapHeight}
      cells={cells}
      pois={pois}
      regions={regions}
      narrativeBeats={narrativeBeats}
    />
  )}

        {/* Right Panel — only shown when something is selected */}
        {(selectedPlacedPOI || selectedRegionData || selectedNarrativeBeat || selectedCell) && (
          <RightPanel
            selectedPOI={selectedPlacedPOI}
            selectedRegion={selectedRegionData}
            selectedBeat={selectedNarrativeBeat}
            selectedCell={selectedCell}
            cells={cells}
            narrativeSchema={narrativeSchema}
            allPOIs={pois}
            allBeats={narrativeBeats}
            onRenamePOI={handlePOIRename}
            onDeletePOI={handlePOIDelete}
            onRenameRegion={handleRegionRename}
            onDeleteRegion={handleRegionDelete}
            onRenameBeat={handleNarrativeBeatRename}
            onDeleteBeat={handleNarrativeBeatDelete}
            onUpdatePOIAssociations={handleUpdatePOIAssociations}
            onUpdateBeatAssociations={handleUpdateBeatAssociations}
            onUpdatePOIGltfUrl={handleUpdatePOIGltfUrl}
            onCellElevationChange={handleCellElevationChange}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            onResizeMap={handleResizeMap}
            collapsed={isRightCollapsed}
          />
        )}
      </div>
    </div>
  )
}
