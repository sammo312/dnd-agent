import type { TerrainColorEntry } from "@dnd-agent/three-engine";

/**
 * Terrain id → color palette.
 *
 * Mirrored from `@dnd-agent/map-editor`'s `naturalTerrains` /
 * `humanMadeTerrains` so the player can colour an imported map without
 * pulling in the editor package (which is workbench-only).
 *
 * If the workbench adds new terrain ids, extend this list. Unknown ids
 * fall back to a neutral grass green via `getTerrainColor`.
 */
export const playerTerrainPalette: TerrainColorEntry[] = [
  // Natural
  { id: "grass", color: "#4ade80" },
  { id: "forest", color: "#166534" },
  { id: "water", color: "#3b82f6" },
  { id: "deep-water", color: "#1e40af" },
  { id: "sand", color: "#fcd34d" },
  { id: "desert", color: "#d97706" },
  { id: "mountain", color: "#78716c" },
  { id: "snow", color: "#f0f9ff" },
  { id: "swamp", color: "#365314" },
  { id: "marsh", color: "#84cc16" },
  { id: "dirt", color: "#92400e" },
  { id: "mud", color: "#78350f" },
  { id: "rock", color: "#57534e" },
  { id: "lava", color: "#dc2626" },
  { id: "ice", color: "#a5f3fc" },
  { id: "tundra", color: "#d1d5db" },
  // Human-made
  { id: "stone-floor", color: "#9ca3af" },
  { id: "cobblestone", color: "#6b7280" },
  { id: "wood-planks", color: "#a16207" },
  { id: "brick", color: "#b91c1c" },
  { id: "marble", color: "#e5e7eb" },
  { id: "tiles", color: "#60a5fa" },
  { id: "gravel", color: "#a8a29e" },
  { id: "dirt-road", color: "#ca8a04" },
  { id: "paved-road", color: "#374151" },
  { id: "carpet", color: "#7c3aed" },
  { id: "metal", color: "#475569" },
  { id: "thatch", color: "#eab308" },
];
