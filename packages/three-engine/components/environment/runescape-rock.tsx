"use client"

export function RunescapeRock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]} rotation={[0.1, 0.3, 0.1]}>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#5a5a5a" flatShading />
      </mesh>
      <mesh position={[0.25, 0.12, 0.1]} rotation={[0.2, -0.5, 0]}>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#4a4a4a" flatShading />
      </mesh>
    </group>
  )
}
