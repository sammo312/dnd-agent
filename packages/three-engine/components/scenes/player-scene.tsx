"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Sky } from "@react-three/drei"
import * as THREE from "three"
import { EnvironmentScene } from "../environment/environment-scene"
import { ScrollCamera } from "../camera/scroll-camera"
import { MovementHandler, WalkToTarget, ClickableGround } from "../camera/fps-camera"
import { TransitionFog } from "../effects/transition-fog"
import type { FirstPersonState } from "../../lib/types"

interface PlayerSceneProps {
  scrollProgress: number
  firstPerson: FirstPersonState
  setFirstPerson: React.Dispatch<React.SetStateAction<FirstPersonState>>
  /** Eye height for first-person camera */
  eyeHeight?: number
}

export function PlayerScene({
  scrollProgress,
  firstPerson,
  setFirstPerson,
  eyeHeight = 0.7,
}: PlayerSceneProps) {
  const hasAutoEnteredRef = useRef(false)
  const [walkTarget, setWalkTarget] = useState<THREE.Vector3 | null>(null)

  const detailLevel = firstPerson.active ? 1 : Math.min(1, Math.max(0, scrollProgress * 1.5))

  const enterFirstPerson = useCallback(() => {
    const position = new THREE.Vector3(1, eyeHeight, -1)
    const facingRotation = Math.atan2(-1, 1)

    setFirstPerson({
      active: true,
      pieceId: "player",
      position,
      rotation: facingRotation,
    })
  }, [setFirstPerson, eyeHeight])

  // Auto-enter FPS at scroll bottom
  useEffect(() => {
    if (scrollProgress >= 0.98 && !firstPerson.active && !hasAutoEnteredRef.current) {
      hasAutoEnteredRef.current = true
      enterFirstPerson()
    } else if (scrollProgress < 0.85 && hasAutoEnteredRef.current) {
      hasAutoEnteredRef.current = false
    }
  }, [scrollProgress, firstPerson.active, enterFirstPerson])

  const handleMove = useCallback(
    (newPos: THREE.Vector3) => {
      setFirstPerson((prev) => ({ ...prev, position: newPos }))
    },
    [setFirstPerson]
  )

  const handleRotate = useCallback(
    (newRotation: number) => {
      setFirstPerson((prev) => ({ ...prev, rotation: newRotation }))
    },
    [setFirstPerson]
  )

  const handleClickToWalk = useCallback(
    (pos: THREE.Vector3) => {
      if (firstPerson.active) {
        setWalkTarget(new THREE.Vector3(pos.x, firstPerson.position.y, pos.z))
      }
    },
    [firstPerson]
  )

  const handleReachTarget = useCallback(() => {
    setWalkTarget(null)
  }, [])

  return (
    <>
      <ScrollCamera scrollProgress={scrollProgress} firstPerson={firstPerson} />
      <TransitionFog detailLevel={detailLevel} firstPersonActive={firstPerson.active} />

      {firstPerson.active && (
        <MovementHandler
          active={firstPerson.active}
          position={firstPerson.position}
          rotation={firstPerson.rotation}
          onMove={handleMove}
          onRotate={handleRotate}
        />
      )}

      <WalkToTarget
        active={walkTarget !== null}
        targetPosition={walkTarget}
        currentPosition={firstPerson.position}
        rotation={firstPerson.rotation}
        onMove={handleMove}
        onRotate={handleRotate}
        onReachTarget={handleReachTarget}
      />

      <ClickableGround onClickPosition={handleClickToWalk} visible={firstPerson.active} />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <EnvironmentScene
        opacity={firstPerson.active ? 1 : Math.min(1, Math.max(0, (detailLevel - 0.3) / 0.5))}
        groundColor="#3d7a3d"
        visible={detailLevel > 0 || firstPerson.active}
      />

      {detailLevel > 0.4 || firstPerson.active ? (
        <Sky
          sunPosition={[100, 20, 100]}
          turbidity={10}
          rayleigh={0.4}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
      ) : (
        <color attach="background" args={[detailLevel > 0.3 ? "#87ceeb" : "#1e3d59"]} />
      )}
    </>
  )
}
