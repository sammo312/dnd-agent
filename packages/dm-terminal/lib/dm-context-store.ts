import { create } from "zustand";

export type CharacterRole = "pc" | "npc" | "antagonist";

export interface Character {
  id: string;
  name: string;
  role: CharacterRole;
  description: string;
  motivation?: string;
}

export interface SceneContext {
  title: string;
  pitch: string;
  summary: string;
  tone?: string;
  setting?: string;
}

interface DmContextStore {
  scene: SceneContext | null;
  characters: Character[];

  /**
   * When true, the prep agent should drive the build without asking
   * follow-up questions — fill in any gaps with confident defaults.
   * Toggled by the user via the `/auto` command.
   */
  autoMode: boolean;

  setScene: (scene: SceneContext) => void;
  addCharacter: (c: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  removeCharacter: (id: string) => void;

  setAutoMode: (enabled: boolean) => void;
  toggleAutoMode: () => boolean;

  reset: () => void;
}

export const useDmContextStore = create<DmContextStore>((set, get) => ({
  scene: null,
  characters: [],
  autoMode: false,

  setScene: (scene) => set({ scene }),

  addCharacter: (c) =>
    set((s) => ({ characters: [...s.characters, c] })),

  updateCharacter: (id, updates) =>
    set((s) => ({
      characters: s.characters.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeCharacter: (id) =>
    set((s) => ({ characters: s.characters.filter((c) => c.id !== id) })),

  setAutoMode: (enabled) => set({ autoMode: enabled }),
  toggleAutoMode: () => {
    const next = !get().autoMode;
    set({ autoMode: next });
    return next;
  },

  reset: () => set({ scene: null, characters: [], autoMode: false }),
}));
