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

/** Panel definitions so we can re-create panels after Dockview's X button removes them */
export const PANEL_DEFS: Record<string, { component: string; title: string }> = {
  "map-editor": { component: "mapEditor", title: "Map Editor" },
  "narrative-editor": { component: "narrativeEditor", title: "Story Boarder" },
  "dm-terminal": { component: "dmTerminal", title: "DM Terminal" },
};

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

  // Panel visibility state — "off" means hidden (setVisible) or closed (removed by X)
  minimizedPanels: Set<string>;
  closedPanels: Set<string>; // subset of minimized — these were fully removed and need re-creation
  minimizePanel: (panelId: string) => void;
  restorePanel: (panelId: string) => void;
  restoreAllPanels: () => void;
  markPanelClosed: (panelId: string) => void; // called when Dockview removes a panel

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // MCP bridge — when on, the workbench long-polls for tool calls from
  // external MCP clients (Claude Desktop, Cursor) and dispatches them
  // through the in-app DM's tool surface. Persisted in localStorage so
  // a reload doesn't drop the user's connection mid-demo.
  mcpEnabled: boolean;
  setMcpEnabled: (enabled: boolean) => void;
}

const MCP_ENABLED_STORAGE_KEY = "workbench.mcp.enabled";

function readPersistedMcpEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MCP_ENABLED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writePersistedMcpEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      MCP_ENABLED_STORAGE_KEY,
      enabled ? "true" : "false",
    );
  } catch {
    // Quota / privacy mode — fail silently; the store still has the value.
  }
}

export const useWorkbenchStore = create<WorkbenchStore>((set, get) => ({
  mapData: null,
  publishMapData: (data) => set({ mapData: data }),

  narrativeData: null,
  publishNarrativeData: (data) => set({ narrativeData: data }),

  // Dockview API reference
  dockviewApi: null,
  setDockviewApi: (api) => set({ dockviewApi: api }),

  // Panel visibility
  minimizedPanels: new Set<string>(),
  closedPanels: new Set<string>(),

  markPanelClosed: (panelId) => {
    const { minimizedPanels, closedPanels } = get();
    const nextMin = new Set(minimizedPanels);
    const nextClosed = new Set(closedPanels);
    nextMin.add(panelId);
    nextClosed.add(panelId);
    set({ minimizedPanels: nextMin, closedPanels: nextClosed });
  },

  minimizePanel: (panelId) => {
    const { dockviewApi, minimizedPanels } = get();
    if (!dockviewApi) return;

    // Prevent minimizing the last visible panel
    const totalPanelIds = Object.keys(PANEL_DEFS).length;
    const visibleCount = totalPanelIds - minimizedPanels.size;
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
    const { dockviewApi, minimizedPanels, closedPanels } = get();
    if (!dockviewApi) return;

    const def = PANEL_DEFS[panelId];
    if (!def) return;

    if (closedPanels.has(panelId)) {
      // Panel was fully removed by Dockview's X button — re-create it
      dockviewApi.addPanel({
        id: panelId,
        component: def.component,
        title: def.title,
      });
      const nextMin = new Set(minimizedPanels);
      const nextClosed = new Set(closedPanels);
      nextMin.delete(panelId);
      nextClosed.delete(panelId);
      set({ minimizedPanels: nextMin, closedPanels: nextClosed });
    } else {
      // Panel was hidden via setVisible — just show it again
      const group = dockviewApi.groups.find((g) =>
        g.panels.some((p) => p.id === panelId)
      );
      if (group) {
        getDockviewComponent(dockviewApi).setVisible(group, true);
        const next = new Set(minimizedPanels);
        next.delete(panelId);
        set({ minimizedPanels: next });
      }
    }
  },

  restoreAllPanels: () => {
    const { dockviewApi, minimizedPanels, closedPanels } = get();
    if (!dockviewApi) return;

    // Re-create any closed panels
    for (const panelId of closedPanels) {
      const def = PANEL_DEFS[panelId];
      if (def) {
        dockviewApi.addPanel({
          id: panelId,
          component: def.component,
          title: def.title,
        });
      }
    }

    // Show any hidden-but-not-removed panels
    const component = getDockviewComponent(dockviewApi);
    for (const group of dockviewApi.groups) {
      component.setVisible(group, true);
    }

    set({ minimizedPanels: new Set(), closedPanels: new Set() });
  },

  // Command palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // MCP bridge
  mcpEnabled: readPersistedMcpEnabled(),
  setMcpEnabled: (enabled) => {
    writePersistedMcpEnabled(enabled);
    set({ mcpEnabled: enabled });
  },
}));
