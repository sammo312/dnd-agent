"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

// ----- useMovementControls hook -----

function useMovementControls(
  active: boolean,
  onMove: (delta: { x: number; z: number }) => void,
  onRotate: (delta: number) => void,
  moveSpeed = 4,
  rotateSpeed = 2.5
) {
  const keys = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!active) return

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase())
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase())
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      keys.current.clear()
    }
  }, [active])

  useFrame((_, delta) => {
    if (!active) return

    const ms = moveSpeed * delta
    const rs = rotateSpeed * delta
    let dz = 0
    let dr = 0

    if (keys.current.has("w")) dz -= ms
    if (keys.current.has("s")) dz += ms
    if (keys.current.has("a")) dr += rs
    if (keys.current.has("d")) dr -= rs

    if (dr !== 0) onRotate(dr)
    if (dz !== 0) onMove({ x: 0, z: dz })
  })
}

// ----- MovementHandler component -----

interface MovementHandlerProps {
  active: boolean
  position: THREE.Vector3
  rotation: number
  onMove: (newPos: THREE.Vector3) => void
  onRotate: (newRotation: number) => void
  bounds?: { min: number; max: number }
  moveSpeed?: number
  rotateSpeed?: number
}

export function MovementHandler({
  active,
  position,
  rotation,
  onMove,
  onRotate,
  bounds = { min: -10, max: 10 },
  moveSpeed = 4,
  rotateSpeed = 2.5,
}: MovementHandlerProps) {
  const posRef = useRef<THREE.Vector3>(position.clone())

  useEffect(() => {
    posRef.current.copy(position)
  }, [position])

  useMovementControls(
    active,
    ({ z }) => {
      const forward = new THREE.Vector3(Math.sin(rotation), 0, Math.cos(rotation))
      const newPos = posRef.current.clone()
      newPos.add(forward.multiplyScalar(-z))

      newPos.x = Math.max(bounds.min, Math.min(bounds.max, newPos.x))
      newPos.z = Math.max(bounds.min, Math.min(bounds.max, newPos.z))

      posRef.current.copy(newPos)
      onMove(newPos.clone())
    },
    (dr) => {
      onRotate(rotation + dr)
    },
    moveSpeed,
    rotateSpeed
  )

  return null
}

// ----- WalkToTarget component -----

interface WalkToTargetProps {
  active: boolean
  targetPosition: THREE.Vector3 | null
  currentPosition: THREE.Vector3
  rotation: number
  onMove: (newPos: THREE.Vector3) => void
  onRotate: (newRotation: number) => void
  onReachTarget: () => void
  walkSpeed?: number
  bounds?: { min: number; max: number }
}

export function WalkToTarget({
  active,
  targetPosition,
  currentPosition,
  rotation,
  onMove,
  onRotate,
  onReachTarget,
  walkSpeed = 3,
  bounds = { min: -12, max: 12 },
}: WalkToTargetProps) {
  useFrame((_, delta) => {
    if (!active || !targetPosition) return

    const distance = new THREE.Vector2(
      targetPosition.x - currentPosition.x,
      targetPosition.z - currentPosition.z
    ).length()

    if (distance < 0.3) {
      onReachTarget()
      return
    }

    const targetRotation = Math.atan2(
      currentPosition.x - targetPosition.x,
      currentPosition.z - targetPosition.z
    )

    let rotationDiff = targetRotation - rotation
    while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2
    while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2

    const newRotation = rotation + rotationDiff * Math.min(1, delta * 5)
    onRotate(newRotation)

    const moveAmt = walkSpeed * delta
    const forward = new THREE.Vector3(Math.sin(newRotation), 0, Math.cos(newRotation))

    const newPos = currentPosition.clone()
    newPos.add(forward.multiplyScalar(-moveAmt))
    newPos.y = currentPosition.y

    newPos.x = Math.max(bounds.min, Math.min(bounds.max, newPos.x))
    newPos.z = Math.max(bounds.min, Math.min(bounds.max, newPos.z))

    onMove(newPos)
  })

  return null
}

// ----- ClickableGround -----

export function ClickableGround({
  onClickPosition,
  visible,
}: {
  onClickPosition: (pos: THREE.Vector3) => void
  visible: boolean
}) {
  if (!visible) return null

  return (
    <mesh
      position={[0, -0.1, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e: any) => {
        e.stopPropagation()
        if (e.point) onClickPosition(e.point.clone())
      }}
      onPointerOver={() => {
        document.body.style.cursor = "crosshair"
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default"
      }}
    >
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}
