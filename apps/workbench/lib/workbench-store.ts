import { create } from "zustand";
import type { DockviewApi, DockviewGroupPanel } from "dockview-react";

/**
 * Access the underlying DockviewComponent from the DockviewApi.
 * The API stores the component as a private field, but at runtime
 * it's a regular property. This is the only way to call
 * component-level methods like setVisible(group, visible) which
 * actually updates the grid layout (the api-level setVisible only fires events).
 */
function getDockviewComponent(api: DockviewApi) {
  return (api as unknown as { component: { setVisible: (panel: DockviewGroupPanel, visible: boolean) => void } }).component;
}

interface MapData {
  width: number;
  height: number;
  cells: any[][];
  pois: any[];
  regions: any[];
  narrativeBeats: any[];
}

interface NarrativeData {
  nodes: any[];
  connections: any[];
}

interface WorkbenchStore {
  // Map data published by map-editor panel
  mapData: MapData | null;
  publishMapData: (data: MapData) => void;

  // Narrative data published by narrative-editor panel
  narrativeData: NarrativeData | null;
  publishNarrativeData: (data: NarrativeData) => void;

  // Dockview API reference
  dockviewApi: DockviewApi | null;
  setDockviewApi: (api: DockviewApi) => void;

  // Panel minimize/maximize state — visible panels are "on", minimized are "off"
  minimizedPanels: Set<string>;
  minimizePanel: (panelId: string) => void;
  restorePanel: (panelId: string) => void;
  restoreAllPanels: () => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useWorkbenchStore = create<WorkbenchStore>((set, get) => ({
  mapData: null,
  publishMapData: (data) => set({ mapData: data }),

  narrativeData: null,
  publishNarrativeData: (data) => set({ narrativeData: data }),

  // Dockview API reference
  dockviewApi: null,
  setDockviewApi: (api) => set({ dockviewApi: api }),

  // Panel minimize/maximize
  minimizedPanels: new Set<string>(),

  minimizePanel: (panelId) => {
    const { dockviewApi, minimizedPanels } = get();
    if (!dockviewApi) return;

    // Prevent minimizing the last visible panel
    const visibleCount = dockviewApi.groups.length - minimizedPanels.size;
    if (visibleCount <= 1) return;

    const panel = dockviewApi.getPanel(panelId);
    if (!panel) return;

    // If this panel is maximized, exit maximize first
    if (dockviewApi.hasMaximizedGroup()) {
      dockviewApi.exitMaximizedGroup();
    }

    // Find the group containing this panel and hide it
    const group = dockviewApi.groups.find((g) =>
      g.panels.some((p) => p.id === panelId)
    );
    if (group) {
      getDockviewComponent(dockviewApi).setVisible(group, false);
      const next = new Set(minimizedPanels);
      next.add(panelId);
      set({ minimizedPanels: next });
    }
  },

  restorePanel: (panelId) => {
    const { dockviewApi, minimizedPanels } = get();
    if (!dockviewApi) return;

    const group = dockviewApi.groups.find((g) =>
      g.panels.some((p) => p.id === panelId)
    );
    if (group) {
      getDockviewComponent(dockviewApi).setVisible(group, true);
      const next = new Set(minimizedPanels);
      next.delete(panelId);
      set({ minimizedPanels: next });
    }
  },

  restoreAllPanels: () => {
    const { dockviewApi } = get();
    if (!dockviewApi) return;

    const component = getDockviewComponent(dockviewApi);
    for (const group of dockviewApi.groups) {
      component.setVisible(group, true);
    }
    set({ minimizedPanels: new Set() });
  },

  // Command palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
