import * as THREE from "three"

export interface FirstPersonState {
  active: boolean
  pieceId: string | null
  position: THREE.Vector3
  rotation: number
}

export interface ScrollCameraConfig {
  /** Width of the map/world in units */
  mapWidth: number
  /** Height/depth of the map/world in units */
  mapHeight: number
}

export interface FPSCameraConfig {
  /** Movement speed in units per second */
  moveSpeed?: number
  /** Rotation speed in radians per second */
  rotateSpeed?: number
  /** Boundary limits for movement */
  bounds?: { min: number; max: number }
}
