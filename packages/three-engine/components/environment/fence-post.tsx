"use client"

export function FencePost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#5c4033" flatShading />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <coneGeometry args={[0.08, 0.15, 4]} />
        <meshStandardMaterial color="#5c4033" flatShading />
      </mesh>
    </group>
  )
}
