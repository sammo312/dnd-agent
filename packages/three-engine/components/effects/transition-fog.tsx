"use client"

import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

interface TransitionFogProps {
  /** 0-1 detail level (scroll-based) */
  detailLevel: number
  /** Whether first-person mode is active */
  firstPersonActive: boolean
  /** Fog color for transition */
  transitionColor?: string
  /** Fog color for FPS atmosphere */
  fpsColor?: string
}

export function TransitionFog({
  detailLevel,
  firstPersonActive,
  transitionColor = "#d4e6d4",
  fpsColor = "#a8c8a8",
}: TransitionFogProps) {
  const { scene } = useThree()

  useFrame(() => {
    let fogDensity = 0
    let fogColor = transitionColor

    if (firstPersonActive) {
      fogDensity = 0.015
      fogColor = fpsColor
    } else if (detailLevel > 0.15 && detailLevel < 0.7) {
      const transitionT =
        detailLevel < 0.4
          ? (detailLevel - 0.15) / 0.25
          : 1 - (detailLevel - 0.4) / 0.3
      fogDensity = Math.max(0, transitionT * 0.08)
    }

    if (fogDensity > 0.001) {
      scene.fog = new THREE.FogExp2(fogColor, fogDensity)
    } else {
      scene.fog = null
    }
  })

  return null
}
