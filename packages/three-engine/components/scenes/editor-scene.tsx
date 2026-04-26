"use client"

import { Environment } from "@react-three/drei"
import { TerrainMesh } from "../terrain/terrain-mesh"
import { TerrainGrid } from "../terrain/terrain-grid"
import { POIMarker } from "../poi/poi-marker"
import { NarrativeBeatMarker } from "../poi/narrative-beat-marker"
import { OrbitCamera } from "../camera/orbit-camera"
import type { TerrainColorEntry } from "../../lib/terrain-utils"

interface MapCell {
  terrain: string
  elevation: number
  regionId?: string
  elevationOffset?: number
}

interface PlacedPOI {
  id: string
  type: string
  name: string
  icon: string
  x: number
  y: number
  size: { w: number; h: number }
  gltfUrl?: string
}

interface PlacedNarrativeBeat {
  id: string
  sectionId: string
  nodeId?: string
  name: string
  x: number
  y: number
  type: "section" | "node"
  associatedPOIs?: string[]
}

interface EditorSceneProps {
  cells: MapCell[][]
  width: number
  height: number
  pois: PlacedPOI[]
  narrativeBeats: PlacedNarrativeBeat[]
  terrains: TerrainColorEntry[]
}

export function EditorScene({ cells, width, height, pois, narrativeBeats, terrains }: EditorSceneProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[width, 10, height]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <TerrainMesh cells={cells} width={width} height={height} terrains={terrains} />
      <TerrainGrid width={width} height={height} />

      {pois.map((poi) => (
        <POIMarker key={poi.id} poi={poi} cells={cells} />
      ))}

      {narrativeBeats.map((beat) => (
        <NarrativeBeatMarker key={beat.id} beat={beat} cells={cells} />
      ))}

      <OrbitCamera mapWidth={width} mapHeight={height} />

      <Environment preset="sunset" />
    </>
  )
}
