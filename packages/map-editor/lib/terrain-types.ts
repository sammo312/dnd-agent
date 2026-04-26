// Base elevation values for terrain types (in units)
// Negative = below sea level, 0 = sea level, Positive = above sea level
export const terrainElevations: Record<string, number> = {
  // Natural terrains
  'grass': 0,
  'forest': 0,
  'water': -1,
  'deep-water': -2,
  'sand': 0,
  'desert': 0,
  'mountain': 2,
  'snow': 1,
  'swamp': -1,
  'marsh': 0,
  'dirt': 0,
  'mud': -1,
  'rock': 1,
  'lava': 0,
  'ice': 0,
  'tundra': 0,
  // Human-made terrains
  'stone-floor': 0,
  'cobblestone': 0,
  'wood-planks': 0,
  'brick': 0,
  'marble': 0,
  'tiles': 0,
  'gravel': 0,
  'dirt-road': 0,
  'paved-road': 0,
  'carpet': 0,
  'metal': 0,
  'thatch': 0,
}

// Natural terrain types
export const naturalTerrains = [
  { id: 'grass', name: 'Grass', color: '#4ade80', icon: '🌿', category: 'natural', baseElevation: 0 },
  { id: 'forest', name: 'Forest', color: '#166534', icon: '🌲', category: 'natural', baseElevation: 0 },
  { id: 'water', name: 'Water', color: '#3b82f6', icon: '🌊', category: 'natural', baseElevation: -1 },
  { id: 'deep-water', name: 'Deep Water', color: '#1e40af', icon: '🌀', category: 'natural', baseElevation: -2 },
  { id: 'sand', name: 'Sand', color: '#fcd34d', icon: '🏖️', category: 'natural', baseElevation: 0 },
  { id: 'desert', name: 'Desert', color: '#d97706', icon: '🏜️', category: 'natural', baseElevation: 0 },
  { id: 'mountain', name: 'Mountain', color: '#78716c', icon: '⛰️', category: 'natural', baseElevation: 2 },
  { id: 'snow', name: 'Snow', color: '#f0f9ff', icon: '❄️', category: 'natural', baseElevation: 1 },
  { id: 'swamp', name: 'Swamp', color: '#365314', icon: '🐸', category: 'natural', baseElevation: -1 },
  { id: 'marsh', name: 'Marsh', color: '#84cc16', icon: '🌾', category: 'natural', baseElevation: 0 },
  { id: 'dirt', name: 'Dirt', color: '#92400e', icon: '🟤', category: 'natural', baseElevation: 0 },
  { id: 'mud', name: 'Mud', color: '#78350f', icon: '💩', category: 'natural', baseElevation: -1 },
  { id: 'rock', name: 'Rocky', color: '#57534e', icon: '🪨', category: 'natural', baseElevation: 1 },
  { id: 'lava', name: 'Lava', color: '#dc2626', icon: '🔥', category: 'natural', baseElevation: 0 },
  { id: 'ice', name: 'Ice', color: '#a5f3fc', icon: '🧊', category: 'natural', baseElevation: 0 },
  { id: 'tundra', name: 'Tundra', color: '#d1d5db', icon: '🥶', category: 'natural', baseElevation: 0 },
] as const

// Human-made terrain types (surfaces/foundations)
export const humanMadeTerrains = [
  { id: 'stone-floor', name: 'Stone Floor', color: '#9ca3af', icon: '⬜', category: 'human-made', baseElevation: 0 },
  { id: 'cobblestone', name: 'Cobblestone', color: '#6b7280', icon: '🔳', category: 'human-made', baseElevation: 0 },
  { id: 'wood-planks', name: 'Wood Planks', color: '#a16207', icon: '🪵', category: 'human-made', baseElevation: 0 },
  { id: 'brick', name: 'Brick', color: '#b91c1c', icon: '🧱', category: 'human-made', baseElevation: 0 },
  { id: 'marble', name: 'Marble', color: '#e5e7eb', icon: '⬜', category: 'human-made', baseElevation: 0 },
  { id: 'tiles', name: 'Tiles', color: '#60a5fa', icon: '🔲', category: 'human-made', baseElevation: 0 },
  { id: 'gravel', name: 'Gravel', color: '#a8a29e', icon: '⚪', category: 'human-made', baseElevation: 0 },
  { id: 'dirt-road', name: 'Dirt Road', color: '#ca8a04', icon: '🛤️', category: 'human-made', baseElevation: 0 },
  { id: 'paved-road', name: 'Paved Road', color: '#374151', icon: '🛣️', category: 'human-made', baseElevation: 0 },
  { id: 'carpet', name: 'Carpet', color: '#7c3aed', icon: '🟪', category: 'human-made', baseElevation: 0 },
  { id: 'metal', name: 'Metal Plating', color: '#475569', icon: '⬛', category: 'human-made', baseElevation: 0 },
  { id: 'thatch', name: 'Thatch', color: '#eab308', icon: '🟡', category: 'human-made', baseElevation: 0 },
] as const

// POI Categories
export const poiCategories = [
  {
    id: 'settlements',
    name: 'Settlements',
    items: [
      { id: 'city', name: 'City', icon: '🏙️', size: { w: 3, h: 3 } },
      { id: 'town', name: 'Town', icon: '🏘️', size: { w: 2, h: 2 } },
      { id: 'village', name: 'Village', icon: '🏡', size: { w: 2, h: 2 } },
      { id: 'hamlet', name: 'Hamlet', icon: '🛖', size: { w: 1, h: 1 } },
      { id: 'camp', name: 'Camp', icon: '⛺', size: { w: 1, h: 1 } },
    ],
  },
  {
    id: 'fortifications',
    name: 'Fortifications',
    items: [
      { id: 'castle', name: 'Castle', icon: '🏰', size: { w: 3, h: 3 } },
      { id: 'fortress', name: 'Fortress', icon: '🏯', size: { w: 2, h: 2 } },
      { id: 'watchtower', name: 'Watchtower', icon: '🗼', size: { w: 1, h: 1 } },
      { id: 'wall', name: 'Wall', icon: '🧱', size: { w: 1, h: 1 } },
      { id: 'gate', name: 'Gate', icon: '⛩️', size: { w: 1, h: 1 } },
    ],
  },
  {
    id: 'buildings',
    name: 'Buildings',
    items: [
      { id: 'house', name: 'House', icon: '🏠', size: { w: 1, h: 1 } },
      { id: 'mansion', name: 'Mansion', icon: '🏛️', size: { w: 2, h: 2 } },
      { id: 'tavern', name: 'Tavern', icon: '🍺', size: { w: 1, h: 1 } },
      { id: 'shop', name: 'Shop', icon: '🏪', size: { w: 1, h: 1 } },
      { id: 'blacksmith', name: 'Blacksmith', icon: '⚒️', size: { w: 1, h: 1 } },
      { id: 'stable', name: 'Stable', icon: '🐴', size: { w: 1, h: 1 } },
      { id: 'windmill', name: 'Windmill', icon: '🌀', size: { w: 1, h: 1 } },
      { id: 'warehouse', name: 'Warehouse', icon: '📦', size: { w: 2, h: 1 } },
      { id: 'barn', name: 'Barn', icon: '🏚️', size: { w: 1, h: 1 } },
    ],
  },
  {
    id: 'religious',
    name: 'Religious',
    items: [
      { id: 'temple', name: 'Temple', icon: '⛪', size: { w: 2, h: 2 } },
      { id: 'shrine', name: 'Shrine', icon: '🕌', size: { w: 1, h: 1 } },
      { id: 'graveyard', name: 'Graveyard', icon: '🪦', size: { w: 2, h: 2 } },
      { id: 'monument', name: 'Monument', icon: '🗿', size: { w: 1, h: 1 } },
    ],
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    items: [
      { id: 'bridge', name: 'Bridge', icon: '🌉', size: { w: 2, h: 1 } },
      { id: 'well', name: 'Well', icon: '⛲', size: { w: 1, h: 1 } },
      { id: 'dock', name: 'Dock', icon: '⚓', size: { w: 2, h: 1 } },
      { id: 'lighthouse', name: 'Lighthouse', icon: '🗼', size: { w: 1, h: 1 } },
      { id: 'mine', name: 'Mine', icon: '⛏️', size: { w: 1, h: 1 } },
      { id: 'quarry', name: 'Quarry', icon: '🪨', size: { w: 2, h: 2 } },
    ],
  },
  {
    id: 'decorative',
    name: 'Decorative',
    items: [
      { id: 'fence-wood', name: 'Wood Fence', icon: '🪵', size: { w: 1, h: 1 } },
      { id: 'fence-stone', name: 'Stone Fence', icon: '⬜', size: { w: 1, h: 1 } },
      { id: 'fence-iron', name: 'Iron Fence', icon: '⬛', size: { w: 1, h: 1 } },
      { id: 'tree-single', name: 'Tree', icon: '🌳', size: { w: 1, h: 1 } },
      { id: 'flower-bed', name: 'Flower Bed', icon: '🌸', size: { w: 1, h: 1 } },
      { id: 'statue', name: 'Statue', icon: '🗽', size: { w: 1, h: 1 } },
      { id: 'fountain', name: 'Fountain', icon: '⛲', size: { w: 1, h: 1 } },
      { id: 'torch', name: 'Torch', icon: '🔥', size: { w: 1, h: 1 } },
      { id: 'banner', name: 'Banner', icon: '🚩', size: { w: 1, h: 1 } },
    ],
  },
  {
    id: 'natural',
    name: 'Natural Features',
    items: [
      { id: 'cave', name: 'Cave', icon: '🕳️', size: { w: 1, h: 1 } },
      { id: 'ruins', name: 'Ruins', icon: '🏚️', size: { w: 2, h: 2 } },
      { id: 'oasis', name: 'Oasis', icon: '🏝️', size: { w: 2, h: 2 } },
      { id: 'waterfall', name: 'Waterfall', icon: '💧', size: { w: 1, h: 2 } },
      { id: 'hot-spring', name: 'Hot Spring', icon: '♨️', size: { w: 1, h: 1 } },
    ],
  },
] as const

export type NaturalTerrain = (typeof naturalTerrains)[number]
export type HumanMadeTerrain = (typeof humanMadeTerrains)[number]
export type TerrainType = NaturalTerrain | HumanMadeTerrain

export type POICategory = (typeof poiCategories)[number]
export type POIItem = POICategory['items'][number]

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
}
