"use client"

import { useMemo } from "react"
import type { TerrainColorEntry } from "../../lib/terrain-utils"
import { getTerrainColor } from "../../lib/terrain-utils"

interface MapCell {
  terrain: string
  elevation: number
  regionId?: string
  elevationOffset?: number
}

interface TerrainMeshProps {
  cells: MapCell[][]
  width: number
  height: number
  terrains: TerrainColorEntry[]
}

export function TerrainMesh({ cells, width, height, terrains }: TerrainMeshProps) {
  const meshData = useMemo(() => {
    const data: { position: [number, number, number]; color: string; height: number }[] = []

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = cells[y]?.[x]
        if (!cell) continue

        const elevation = cell.elevation ?? 0
        const boxHeight = 0.1 + Math.max(0, elevation * 0.3)
        const colorHex = getTerrainColor(cell.terrain, terrains)

        data.push({
          position: [x + 0.5, (elevation * 0.3) / 2, y + 0.5],
          color: colorHex,
          height: boxHeight,
        })
      }
    }

    return data
  }, [cells, width, height, terrains])

  const groupedByColor = useMemo(() => {
    const groups: Record<string, typeof meshData> = {}
    for (const cell of meshData) {
      if (!groups[cell.color]) groups[cell.color] = []
      groups[cell.color].push(cell)
    }
    return groups
  }, [meshData])

  return (
    <group>
      {Object.entries(groupedByColor).map(([color, cells]) => (
        <group key={color}>
          {cells.map((cell, idx) => (
            <mesh
              key={idx}
              position={cell.position}
              receiveShadow
              castShadow
            >
              <boxGeometry args={[1, cell.height, 1]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
