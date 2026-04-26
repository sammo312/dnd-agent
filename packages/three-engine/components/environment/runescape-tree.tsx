"use client"

export function RunescapeTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.25, 1, 0.25]} />
        <meshStandardMaterial color="#4a3728" flatShading />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <coneGeometry args={[0.6, 1.2, 5]} />
        <meshStandardMaterial color="#1a5c1a" flatShading />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <coneGeometry args={[0.45, 0.9, 5]} />
        <meshStandardMaterial color="#228b22" flatShading />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <coneGeometry args={[0.3, 0.7, 5]} />
        <meshStandardMaterial color="#2d8b2d" flatShading />
      </mesh>
    </group>
  )
}
