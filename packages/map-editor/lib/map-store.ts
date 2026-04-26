import { create } from "zustand";

/**
 * Cross-package bridge for DM-driven map mutations.
 *
 * The MapEditor component remains the source of truth for the
 * editable map state (cells, POIs, regions). It SUBSCRIBES to
 * `pendingMutations` and applies them, then calls `consumeMutation()`.
 * It also PUBLISHES its current snapshot so the DM agent can read
 * dimensions and POI counts on each turn.
 */

export type DmMapMutation =
  | {
      type: "set_dimensions";
      width: number;
      height: number;
      // If true, also clear all cells/pois/regions to start fresh.
      reset?: boolean;
    }
  | {
      type: "paint_rect";
      terrain: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }
  | {
      type: "add_poi";
      poiType: string;
      name: string;
      x: number;
      y: number;
    }
  | {
      type: "set_spawn";
      x: number;
      y: number;
    }
  | {
      type: "place_beat";
      sectionName: string;
      nodeId?: string;
      name: string;
      x: number;
      y: number;
      radius?: number;
      oneShot?: boolean;
    }
  | {
      type: "clear";
    };

export interface MapBeatSnapshot {
  id: string;
  sectionName: string;
  nodeId?: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  oneShot: boolean;
}

export interface MapSnapshot {
  width: number;
  height: number;
  poiCount: number;
  poiSummary: { type: string; name: string; x: number; y: number }[];
  /** Player spawn tile, if set. */
  spawn?: { x: number; y: number };
  /** Beats placed on the map. */
  beats: MapBeatSnapshot[];
}

/**
 * Full editor state for export. The editor publishes this
 * separately from the lean DM-context snapshot so the export
 * pipeline can reach the cells/POIs/regions without coupling
 * to the editor component directly.
 */
export interface MapExportSnapshot {
  width: number;
  height: number;
  cells: Array<
    Array<{
      terrain: string;
      elevation: number;
      elevationOffset?: number;
      regionId?: string;
    }>
  >;
  pois: Array<{
    id: string;
    type: string;
    name: string;
    icon: string;
    x: number;
    y: number;
    size: { w: number; h: number };
    gltfUrl?: string;
  }>;
  regions: Array<{
    id: string;
    name: string;
    color: string;
    pixels: { x: number; y: number }[];
  }>;
  spawn?: { x: number; y: number };
  beats: Array<{
    id: string;
    sectionId: string;
    nodeId?: string;
    name: string;
    x: number;
    y: number;
    radius?: number;
    oneShot?: boolean;
  }>;
}

interface MapStore {
  /** Mutations queued by the DM agent. MapEditor drains this on render. */
  pendingMutations: DmMapMutation[];
  enqueueMutation: (m: DmMapMutation) => void;
  consumeMutations: () => void;

  /** Lean snapshot used by the DM agent system prompt. */
  snapshot: MapSnapshot;
  publishSnapshot: (snap: MapSnapshot) => void;

  /** Full snapshot used by the project export pipeline. */
  exportSnapshot: MapExportSnapshot | null;
  publishExportSnapshot: (snap: MapExportSnapshot) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  pendingMutations: [],
  enqueueMutation: (m) =>
    set((s) => ({ pendingMutations: [...s.pendingMutations, m] })),
  consumeMutations: () => set({ pendingMutations: [] }),

  snapshot: { width: 20, height: 15, poiCount: 0, poiSummary: [], beats: [] },
  publishSnapshot: (snapshot) => set({ snapshot }),

  exportSnapshot: null,
  publishExportSnapshot: (exportSnapshot) => set({ exportSnapshot }),
}));
