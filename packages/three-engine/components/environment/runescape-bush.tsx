"use client"

export function RunescapeBush({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]}>
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#2d6b2d" flatShading />
      </mesh>
      <mesh position={[0.15, 0.25, 0.1]}>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#3d7b3d" flatShading />
      </mesh>
    </group>
  )
}
