export interface TerrainColorEntry {
  id: string
  color: string
}

export function getTerrainColor(terrainId: string, terrains: TerrainColorEntry[]): string {
  const terrain = terrains.find((t) => t.id === terrainId)
  return terrain?.color || "#4ade80"
}
