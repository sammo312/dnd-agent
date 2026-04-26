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

  setScene: (scene: SceneContext) => void;
  addCharacter: (c: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  removeCharacter: (id: string) => void;
  reset: () => void;
}

export const useDmContextStore = create<DmContextStore>((set) => ({
  scene: null,
  characters: [],

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

  reset: () => set({ scene: null, characters: [] }),
}));
