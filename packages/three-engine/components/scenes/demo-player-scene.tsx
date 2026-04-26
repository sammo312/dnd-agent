"use client"

import { useRef, useEffect, useCallback } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Sky, Html } from "@react-three/drei"
import * as THREE from "three"
import { EntityCapsule } from "../entities/entity-capsule"

// ──────────────────────────────────────────────────────
// DemoPlayerScene: the Living Stage player view.
//
// Receives GameState from parent via props. Renders:
//   - Ground plane (simple green terrain)
//   - Entity capsules (colored, named, status indicators)
//   - Lighting (preset-driven)
//   - Camera (orbit default, AI can temporarily take over)
//   - Fog (starts dense, reveals on first narration)
//   - Ambient light based on mood
// ──────────────────────────────────────────────────────

interface WorldEntity {
  id: string
  type: string
  name: string
  position: { x: number; y: number; z: number }
  color: string
  status?: {
    health?: { current: number; max: number }
    condition?: string
  }
  spawned_at: number
}

interface CameraDirective {
  target: { x: number; y: number; z: number }
  duration: number
  returnControl: boolean
  started_at: number
}

type LightingPreset =
  | "daylight" | "moonlit" | "dramatic_red" | "firelight"
  | "storm" | "dim" | "sunrise"

type MoodPreset =
  | "calm" | "tense" | "combat" | "celebration" | "mystery"

interface DemoPlayerSceneProps {
  entities: Record<string, WorldEntity>
  lighting: LightingPreset
  mood: MoodPreset
  cameraDirective: CameraDirective | null
  fogRevealed: boolean
  mapSize?: number // grid size (default 20)
}

// Lighting presets: [ambientIntensity, directionalIntensity, sunPosition, bgColor]
const LIGHTING_CONFIG: Record<LightingPreset, {
  ambient: number
  directional: number
  sunPosition: [number, number, number]
  bgColor: string
  fogColor: string
}> = {
  daylight: { ambient: 0.7, directional: 1.2, sunPosition: [100, 50, 100], bgColor: "#87ceeb", fogColor: "#d4e6d4" },
  moonlit: { ambient: 0.2, directional: 0.4, sunPosition: [-50, 20, -50], bgColor: "#1a1a3e", fogColor: "#1a1a3e" },
  dramatic_red: { ambient: 0.3, directional: 0.8, sunPosition: [50, 10, 0], bgColor: "#3d0000", fogColor: "#3d0000" },
  firelight: { ambient: 0.3, directional: 0.6, sunPosition: [10, 5, 10], bgColor: "#2d1b00", fogColor: "#2d1b00" },
  storm: { ambient: 0.15, directional: 0.3, sunPosition: [0, 80, 0], bgColor: "#2c2c3a", fogColor: "#2c2c3a" },
  dim: { ambient: 0.15, directional: 0.2, sunPosition: [-20, 10, -20], bgColor: "#1e1e2e", fogColor: "#1e1e2e" },
  sunrise: { ambient: 0.5, directional: 0.9, sunPosition: [200, 10, 50], bgColor: "#ff9966", fogColor: "#ffcc99" },
}

// Mood tints applied to ambient light
const MOOD_TINT: Record<MoodPreset, string> = {
  calm: "#ffffff",
  tense: "#ffaaaa",
  combat: "#ff4444",
  celebration: "#ffffaa",
  mystery: "#aaaaff",
}

export function DemoPlayerScene({
  entities,
  lighting,
  mood,
  cameraDirective,
  fogRevealed,
  mapSize = 20,
}: DemoPlayerSceneProps) {
  const { camera, scene } = useThree()
  const controlsRef = useRef<any>(null)
  const cameraAnimatingRef = useRef(false)
  const cameraStartPos = useRef(new THREE.Vector3())
  const cameraStartTarget = useRef(new THREE.Vector3())
  const cameraEndTarget = useRef(new THREE.Vector3())
  const cameraAnimStartRef = useRef(0)
  const cameraAnimDurationRef = useRef(2)
  const cameraReturnControlRef = useRef(true)
  const lastDirectiveRef = useRef<number | null>(null)

  const lightConfig = LIGHTING_CONFIG[lighting] || LIGHTING_CONFIG.daylight
  const moodTint = MOOD_TINT[mood] || MOOD_TINT.calm

  // Fog based on reveal state
  useFrame(() => {
    if (!fogRevealed) {
      scene.fog = new THREE.FogExp2("#0a0a0a", 0.15)
    } else {
      // Light fog based on lighting preset
      const density = lighting === "daylight" ? 0.005 : 0.02
      scene.fog = new THREE.FogExp2(lightConfig.fogColor, density)
    }
  })

  // Camera directive handling
  useEffect(() => {
    if (!cameraDirective) return
    if (lastDirectiveRef.current === cameraDirective.started_at) return
    lastDirectiveRef.current = cameraDirective.started_at

    // Start camera animation
    cameraAnimatingRef.current = true
    cameraStartPos.current.copy(camera.position)
    if (controlsRef.current) {
      cameraStartTarget.current.copy(controlsRef.current.target)
    }
    cameraEndTarget.current.set(
      cameraDirective.target.x,
      cameraDirective.target.y + 2,
      cameraDirective.target.z,
    )
    cameraAnimStartRef.current = Date.now()
    cameraAnimDurationRef.current = cameraDirective.duration * 1000
    cameraReturnControlRef.current = cameraDirective.returnControl

    // Disable orbit controls during animation
    if (controlsRef.current) {
      controlsRef.current.enabled = false
    }
  }, [cameraDirective, camera])

  // Animate camera
  useFrame(() => {
    if (!cameraAnimatingRef.current) return

    const elapsed = Date.now() - cameraAnimStartRef.current
    const t = Math.min(1, elapsed / cameraAnimDurationRef.current)
    // Smooth ease-in-out
    const eased = t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2

    // Interpolate camera look-at target
    if (controlsRef.current) {
      const target = controlsRef.current.target as THREE.Vector3
      target.lerpVectors(cameraStartTarget.current, cameraEndTarget.current, eased)
    }

    // Move camera to a good viewing position above and behind the target
    const lookPos = new THREE.Vector3().lerpVectors(
      cameraStartPos.current,
      new THREE.Vector3(
        cameraEndTarget.current.x + 5,
        cameraEndTarget.current.y + 8,
        cameraEndTarget.current.z + 5,
      ),
      eased,
    )
    camera.position.copy(lookPos)

    if (t >= 1) {
      cameraAnimatingRef.current = false
      if (cameraReturnControlRef.current && controlsRef.current) {
        controlsRef.current.enabled = true
      }
    }
  })

  const entityArray = Object.values(entities)

  return (
    <>
      {/* Camera controls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        minDistance={3}
        maxDistance={mapSize * 3}
        target={[mapSize / 2, 0, mapSize / 2]}
      />

      {/* Lighting */}
      <ambientLight intensity={lightConfig.ambient} color={moodTint} />
      <directionalLight
        position={lightConfig.sunPosition}
        intensity={lightConfig.directional}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Sky */}
      {fogRevealed && (
        <Sky
          sunPosition={lightConfig.sunPosition}
          turbidity={10}
          rayleigh={lighting === "moonlit" || lighting === "dim" ? 0.1 : 0.4}
        />
      )}

      {/* Background color when fog not revealed */}
      {!fogRevealed && <color attach="background" args={["#0a0a0a"]} />}
      {fogRevealed && <color attach="background" args={[lightConfig.bgColor]} />}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[mapSize / 2, -0.01, mapSize / 2]}>
        <planeGeometry args={[mapSize, mapSize]} />
        <meshStandardMaterial color="#3d7a3d" />
      </mesh>

      {/* Grid helper */}
      <gridHelper
        args={[mapSize, mapSize, "#4a4a4a", "#3a3a3a"]}
        position={[mapSize / 2, 0, mapSize / 2]}
      />

      {/* Entities */}
      {entityArray.map((entity) => (
        <EntityCapsule
          key={entity.id}
          id={entity.id}
          name={entity.name}
          position={entity.position}
          color={entity.color}
          status={entity.status}
        />
      ))}
    </>
  )
}
