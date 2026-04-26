/**
 * Canonical project-export contract.
 *
 * This is the wire format the workbench's "Export" button writes and the
 * player app reads. It lives in `@dnd-agent/shared` so neither side has
 * to depend on the other's heavyweight runtime packages (workbench
 * stores, narrative-editor, map-editor, etc.).
 *
 * Runtime model:
 *   1. The single 'preface' section runs once on project load.
 *   2. Player spawns onto the map at `map.spawn`.
 *   3. Walking within `radius` of a `map.beats[i]` triggers that beat's
 *      section. `oneShot:true` beats fire once.
 *   4. A section ends when its current dialogue node has no choices.
 */

export const PROJECT_EXPORT_VERSION = 1;

export interface ExportedDialogueSegment {
  text: string;
  speed?: number;
  style?: { color?: string; bold?: boolean; italic?: boolean };
}

export interface ExportedChoice {
  label: string;
  /** Target dialogue node id within the same section. */
  id: string;
}

export interface ExportedDialogueNode {
  id: string;
  speaker: string;
  dialogue: ExportedDialogueSegment[];
  choices?: ExportedChoice[];
  background?: string;
  music?: string;
  gltf?: string;
}

export interface ExportedSection {
  name: string;
  title?: string;
  kind: 'preface' | 'beat';
  startId: string;
  background?: string;
  music?: string;
  gltf?: string;
  nodes: ExportedDialogueNode[];
}

export interface ExportedBeat {
  id: string;
  sectionName: string;
  /** If set, beat starts at this node id instead of the section's start. */
  nodeId?: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  oneShot: boolean;
}

export interface ExportedCharacter {
  id: string;
  name: string;
  role: 'pc' | 'npc' | 'antagonist';
  description: string;
  motivation?: string;
}

export interface ExportedMapCell {
  terrain: string;
  elevation: number;
  elevationOffset?: number;
  regionId?: string;
}

export interface ExportedPOI {
  id: string;
  type: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  size: { w: number; h: number };
  gltfUrl?: string;
}

export interface ExportedRegion {
  id: string;
  name: string;
  color: string;
  pixels: { x: number; y: number }[];
}

export interface ExportedMap {
  width: number;
  height: number;
  cells: ExportedMapCell[][];
  pois: ExportedPOI[];
  regions: ExportedRegion[];
  spawn: { x: number; y: number };
  beats: ExportedBeat[];
}

export interface ExportedScene {
  title?: string;
  pitch?: string;
  summary?: string;
  tone?: string;
  setting?: string;
}

export interface ExportedProject {
  version: number;
  meta: {
    title: string;
    summary?: string;
    exportedAt: string;
  };
  scene: ExportedScene | null;
  characters: ExportedCharacter[];
  sections: ExportedSection[];
  map: ExportedMap;
}
