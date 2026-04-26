export interface NarrativeAssociation {
  sectionId: string
  nodeId?: string // If undefined, associated with entire section
}

export interface PlacedPOI {
  id: string
  type: string
  name: string
  icon: string
  x: number
  y: number
  size: { w: number; h: number }
  narrativeAssociations?: NarrativeAssociation[]
  gltfUrl?: string // URL to a GLTF/GLB model for 3D representation
}

export interface MapCell {
  terrain: string
  regionId?: string
  elevation: number // Total elevation = base terrain elevation + manual adjustment
  elevationOffset?: number // Manual adjustment to elevation
}

export interface NamedRegion {
  id: string
  name: string
  color: string
  pixels: { x: number; y: number }[]
}

export interface MapData {
  width: number
  height: number
  cells: MapCell[][]
  pois: PlacedPOI[]
  regions: NamedRegion[]
  narrativeBeats: PlacedNarrativeBeat[]
  /** Tile the player loads into when entering the map. */
  spawn?: { x: number; y: number }
}

// Narrative Schema Types
export interface NarrativeChoice {
  label: string
  id: string
}

export interface NarrativeDialogue {
  text: string
  speed?: number
  style?: { color?: string }
}

export interface NarrativeNode {
  id: string
  speaker: string
  dialogue: NarrativeDialogue[]
  gltf?: string
  choices?: NarrativeChoice[]
}

export interface NarrativeSection {
  nodes: NarrativeNode[]
  background?: string
  music?: string
  gltf?: string
}

export interface NarrativeSchema {
  [sectionName: string]: NarrativeSection
}

export interface PlacedNarrativeBeat {
  id: string
  sectionId: string
  nodeId?: string // If undefined, represents the entire section
  name: string
  x: number
  y: number
  type: 'section' | 'node'
  associatedPOIs?: string[] // POI ids associated with this beat
  /** Trigger radius in tiles. Defaults to 1 if omitted. */
  radius?: number
  /** If true, the beat fires only the first time the player enters its range. Defaults to true. */
  oneShot?: boolean
}

// Terrain-related types (standalone, without const array dependencies)
export interface TerrainType {
  id: string
  name: string
  color: string
  icon: string
  category: 'natural' | 'human-made'
  baseElevation: number
}

export interface POIItemSize {
  w: number
  h: number
}

export interface POIItem {
  id: string
  name: string
  icon: string
  size: POIItemSize
}

export interface POICategory {
  id: string
  name: string
  items: POIItem[]
}
