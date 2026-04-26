// Terrain
export { TerrainMesh } from "./components/terrain/terrain-mesh"
export { TerrainGrid } from "./components/terrain/terrain-grid"

// POI
export { POIMarker } from "./components/poi/poi-marker"
export { NarrativeBeatMarker } from "./components/poi/narrative-beat-marker"

// Environment
export { RunescapeTree } from "./components/environment/runescape-tree"
export { RunescapeRock } from "./components/environment/runescape-rock"
export { RunescapeBush } from "./components/environment/runescape-bush"
export { FencePost } from "./components/environment/fence-post"
export { EnvironmentScene } from "./components/environment/environment-scene"

// Camera
export { OrbitCamera } from "./components/camera/orbit-camera"
export { ScrollCamera } from "./components/camera/scroll-camera"
export { MovementHandler, WalkToTarget, ClickableGround } from "./components/camera/fps-camera"

// Effects
export { TransitionFog } from "./components/effects/transition-fog"
export { SkyController } from "./components/effects/sky-controller"

// Scenes
export { EditorScene } from "./components/scenes/editor-scene"
export { PlayerScene } from "./components/scenes/player-scene"

// Lib
export { getTerrainColor, type TerrainColorEntry } from "./lib/terrain-utils"
export { lerpCamera } from "./lib/camera-utils"
export type { FirstPersonState, ScrollCameraConfig, FPSCameraConfig } from "./lib/types"
