import * as THREE from "three"

/**
 * Smoothly interpolate camera position and look-at target
 */
export function lerpCamera(
  camera: THREE.Camera,
  targetPosition: THREE.Vector3,
  currentLookAt: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  speed: number
) {
  camera.position.lerp(targetPosition, speed)
  currentLookAt.lerp(targetLookAt, speed)
  camera.lookAt(currentLookAt)
}
