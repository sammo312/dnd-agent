"use client"

import { Canvas } from "@react-three/fiber"
import { EditorScene } from "@dnd-agent/three-engine"
import type { TerrainColorEntry } from "@dnd-agent/three-engine"
import type { MapCell, PlacedPOI, NamedRegion, PlacedNarrativeBeat } from "../lib/terrain-types"
import { naturalTerrains, humanMadeTerrains } from "../lib/terrain-types"

interface MapViewer3DProps {
  width: number
  height: number
  cells: MapCell[][]
  pois: PlacedPOI[]
  regions: NamedRegion[]
  narrativeBeats: PlacedNarrativeBeat[]
}

const allTerrains: TerrainColorEntry[] = [...naturalTerrains, ...humanMadeTerrains].map(t => ({
  id: t.id,
  color: t.color,
}))

export function MapViewer3D({
  width,
  height,
  cells,
  pois,
  regions,
  narrativeBeats,
}: MapViewer3DProps) {
  return (
    <div className="flex-1 relative">
      <Canvas
        shadows
        camera={{
          position: [width * 0.8, width * 0.6, height * 0.8],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        className="bg-slate-900"
      >
        <EditorScene
          cells={cells}
          width={width}
          height={height}
          pois={pois}
          narrativeBeats={narrativeBeats}
          terrains={allTerrains}
        />
      </Canvas>

    </div>
  )
}
