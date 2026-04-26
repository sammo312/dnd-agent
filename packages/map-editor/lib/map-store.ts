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
      type: "clear";
    };

export interface MapSnapshot {
  width: number;
  height: number;
  poiCount: number;
  poiSummary: { type: string; name: string; x: number; y: number }[];
}

interface MapStore {
  /** Mutations queued by the DM agent. MapEditor drains this on render. */
  pendingMutations: DmMapMutation[];
  enqueueMutation: (m: DmMapMutation) => void;
  consumeMutations: () => void;

  /** Current snapshot published by the MapEditor for the DM context. */
  snapshot: MapSnapshot;
  publishSnapshot: (snap: MapSnapshot) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  pendingMutations: [],
  enqueueMutation: (m) =>
    set((s) => ({ pendingMutations: [...s.pendingMutations, m] })),
  consumeMutations: () => set({ pendingMutations: [] }),

  snapshot: { width: 20, height: 15, poiCount: 0, poiSummary: [] },
  publishSnapshot: (snapshot) => set({ snapshot }),
}));
