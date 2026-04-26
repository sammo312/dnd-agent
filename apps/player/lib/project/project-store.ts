/**
 * Player-side store for the loaded project.
 *
 * Holds the validated `ExportedProject` (or null), plus a tiny bit of
 * UI state — last load source (filename), last import errors. Other
 * player surfaces (3D scene, terminal, narration) read from this
 * store instead of fetching their own copy of the JSON.
 *
 * `hydrate*` helpers persist the project to sessionStorage so a hard
 * refresh during dev doesn't force the user to drag the file in again.
 * (sessionStorage, not localStorage — the player is intended to feel
 * like a fresh session each time you open it.)
 */

"use client";

import { create } from "zustand";
import type { ExportedProject } from "@dnd-agent/shared/types/project-export";
import {
  parseProjectFromText,
  type ParseProjectResult,
} from "./parse-project";

const SESSION_KEY = "dnd-agent.player.project";

export interface LoadProjectMeta {
  /** Filename the project came from, if known. Used in the UI. */
  filename?: string;
}

interface ProjectState {
  project: ExportedProject | null;
  filename: string | null;
  errors: string[];
  /** Last successful load timestamp (ms). Lets components react to fresh imports. */
  loadedAt: number | null;

  loadFromText: (text: string, meta?: LoadProjectMeta) => ParseProjectResult;
  loadFromFile: (file: File) => Promise<ParseProjectResult>;
  setProject: (project: ExportedProject, meta?: LoadProjectMeta) => void;
  clear: () => void;
  /** Restore a previously-loaded project from sessionStorage, if any. */
  hydrateFromSession: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  filename: null,
  errors: [],
  loadedAt: null,

  loadFromText: (text, meta) => {
    const result = parseProjectFromText(text);
    if (result.ok) {
      persistToSession(result.project, meta?.filename ?? null);
      set({
        project: result.project,
        filename: meta?.filename ?? null,
        errors: [],
        loadedAt: Date.now(),
      });
    } else {
      set({ errors: result.errors });
    }
    return result;
  },

  loadFromFile: async (file) => {
    let text: string;
    try {
      text = await file.text();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const result: ParseProjectResult = {
        ok: false,
        errors: [`Couldn't read file "${file.name}": ${message}`],
      };
      set({ errors: result.errors });
      return result;
    }

    const result = parseProjectFromText(text);
    if (result.ok) {
      persistToSession(result.project, file.name);
      set({
        project: result.project,
        filename: file.name,
        errors: [],
        loadedAt: Date.now(),
      });
    } else {
      set({ errors: result.errors });
    }
    return result;
  },

  setProject: (project, meta) => {
    persistToSession(project, meta?.filename ?? null);
    set({
      project,
      filename: meta?.filename ?? null,
      errors: [],
      loadedAt: Date.now(),
    });
  },

  clear: () => {
    clearSession();
    set({ project: null, filename: null, errors: [], loadedAt: null });
  },

  hydrateFromSession: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as {
        project: unknown;
        filename: string | null;
      };
      // Re-validate on hydrate — the cached envelope is only as
      // trustworthy as the schema it was written under.
      const result = parseProjectFromText(JSON.stringify(stored.project));
      if (result.ok) {
        set({
          project: result.project,
          filename: stored.filename,
          errors: [],
          loadedAt: Date.now(),
        });
      } else {
        clearSession();
      }
    } catch {
      clearSession();
    }
  },
}));

function persistToSession(
  project: ExportedProject,
  filename: string | null,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ project, filename }),
    );
  } catch {
    // sessionStorage can throw on quota exceeded / private mode — the
    // store still has the in-memory copy, so this is non-fatal.
  }
}

function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Same as above — non-fatal.
  }
}
