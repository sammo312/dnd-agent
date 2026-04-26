"use client"

import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import type { FirstPersonState } from "../../lib/types"
import { lerpCamera } from "../../lib/camera-utils"

interface ScrollCameraProps {
  scrollProgress: number
  firstPerson: FirstPersonState
  isWalking?: boolean
  /** Default dive target position (where camera goes at scroll=1) */
  diveTarget?: THREE.Vector3
  /** Default facing angle for the dive */
  diveFacing?: number
}

export function ScrollCamera({
  scrollProgress,
  firstPerson,
  isWalking = false,
  diveTarget,
  diveFacing,
}: ScrollCameraProps) {
  const { camera } = useThree()
  const targetPosition = useRef(new THREE.Vector3(0, 14, 0.1))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0))

  const defaultTarget = diveTarget ?? new THREE.Vector3(1, 0.7, -1)
  const defaultFacing = diveFacing ?? Math.atan2(-1, 1)

  useFrame(() => {
    if (firstPerson.active) {
      const pos = firstPerson.position.y > 0.1 ? firstPerson.position : defaultTarget

      const forward = new THREE.Vector3(
        Math.sin(firstPerson.rotation),
        0,
        Math.cos(firstPerson.rotation)
      )

      targetPosition.current.copy(pos)
      targetLookAt.current.copy(pos).add(forward.multiplyScalar(5))
    } else if (isWalking && firstPerson.position.y > 0.1) {
      const pos = firstPerson.position
      const forward = new THREE.Vector3(
        Math.sin(firstPerson.rotation),
        0,
        Math.cos(firstPerson.rotation)
      )

      const cameraOffset = forward.clone().multiplyScalar(4)
      cameraOffset.y = 3

      targetPosition.current.copy(pos).add(cameraOffset)
      targetLookAt.current.copy(pos).add(forward.clone().multiplyScalar(-3))
    } else {
      let pos: THREE.Vector3
      let lookAt: THREE.Vector3

      if (scrollProgress < 0.25) {
        const t = scrollProgress / 0.25
        pos = new THREE.Vector3(0, 14 - t * 2, 0.1 + t * 3)
        lookAt = new THREE.Vector3(0, 0, 0)
      } else if (scrollProgress < 0.5) {
        const t = (scrollProgress - 0.25) / 0.25
        pos = new THREE.Vector3(t * 3, 12 - t * 5, 3 + t * 4)
        lookAt = new THREE.Vector3(0, 0, 0)
      } else if (scrollProgress < 0.75) {
        const t = (scrollProgress - 0.5) / 0.25
        pos = new THREE.Vector3(3 - t * 1, 7 - t * 4, 7 - t * 3)
        lookAt = new THREE.Vector3(0, 0.3, -1)
      } else {
        const t = (scrollProgress - 0.75) / 0.25
        const easeT = t * t * (3 - 2 * t)

        const startPos = new THREE.Vector3(2, 3, 4)
        const endPos = defaultTarget.clone()
        pos = new THREE.Vector3().lerpVectors(startPos, endPos, easeT)

        const forward = new THREE.Vector3(
          Math.sin(defaultFacing),
          0,
          Math.cos(defaultFacing)
        )
        const startLook = new THREE.Vector3(0, 0.3, -1)
        const endLook = defaultTarget.clone().add(forward.multiplyScalar(5))
        lookAt = new THREE.Vector3().lerpVectors(startLook, endLook, easeT)
      }

      targetPosition.current.copy(pos)
      targetLookAt.current.copy(lookAt)
    }

    const lerpSpeed = firstPerson.active ? 0.2 : 0.08
    lerpCamera(camera, targetPosition.current, currentLookAt.current, targetLookAt.current, lerpSpeed)
  })

  return null
}
