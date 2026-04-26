/**
 * Narrative runtime store — tracks which section/node the player is
 * currently inside, plus which one-shot beats have already fired.
 *
 * Wire-format contract refresher:
 *   - One `kind: "preface"` section runs on project load.
 *   - Beats live on the map; walking into one's `radius` triggers
 *     that beat's section (optionally jumping to a specific nodeId).
 *   - A section ends when the current dialogue node has no choices.
 *   - `oneShot: true` beats fire exactly once per session.
 *
 * The store is purely about *what* dialogue should be on screen.
 * Rendering, typewriter timing, and proximity detection live in the
 * components that read from it.
 */

"use client";

import { create } from "zustand";
import type {
  ExportedDialogueNode,
  ExportedProject,
  ExportedSection,
} from "@dnd-agent/shared";

export interface ActiveDialogue {
  section: ExportedSection;
  node: ExportedDialogueNode;
  /** Beat that triggered this dialogue, if any (null for the preface). */
  beatId: string | null;
}

interface NarrativeState {
  active: ActiveDialogue | null;
  /** Beat ids that have already fired and shouldn't re-trigger. */
  triggered: Set<string>;
  /**
   * Beat ids the player is currently *inside* the radius of. Used to
   * gate re-triggering on non-oneShot beats — you must leave and come
   * back, otherwise standing on a beat would loop the dialogue.
   */
  inside: Set<string>;
  /** True once the preface has been auto-fired this session. */
  prefaceFired: boolean;

  /** Manually open a section at its declared startId (or a given node). */
  openSection: (
    project: ExportedProject,
    sectionName: string,
    options?: { nodeId?: string; beatId?: string | null },
  ) => void;
  /** Try to fire a beat. No-op if it's already triggered (oneShot) or already inside. */
  fireBeat: (project: ExportedProject, beatId: string) => void;
  /** Auto-fire the project's preface if it hasn't run yet. */
  firePrefaceIfNeeded: (project: ExportedProject) => void;
  /** Pick a choice on the active node, advancing to its target. */
  chooseChoice: (project: ExportedProject, choiceId: string) => void;
  /** Close the dialogue overlay (end of section or user dismissal). */
  endDialogue: () => void;

  /** Proximity bookkeeping — call from the scene each frame. */
  markInside: (beatId: string) => void;
  markOutside: (beatId: string) => void;

  /** Reset everything. Called when a new project is imported. */
  reset: () => void;
}

export const useNarrativeStore = create<NarrativeState>((set, get) => ({
  active: null,
  triggered: new Set<string>(),
  inside: new Set<string>(),
  prefaceFired: false,

  openSection: (project, sectionName, options) => {
    const section = findSection(project, sectionName);
    if (!section) return;
    const nodeId = options?.nodeId ?? section.startId;
    const node = findNode(section, nodeId);
    if (!node) return;
    set({
      active: { section, node, beatId: options?.beatId ?? null },
    });
  },

  fireBeat: (project, beatId) => {
    const { triggered, active } = get();
    // Don't stack a new beat over an already-open dialogue.
    if (active) return;
    const beat = project.map.beats.find((b) => b.id === beatId);
    if (!beat) return;
    if (beat.oneShot && triggered.has(beatId)) return;

    const section = findSection(project, beat.sectionName);
    if (!section) return;
    const nodeId = beat.nodeId ?? section.startId;
    const node = findNode(section, nodeId);
    if (!node) return;

    const nextTriggered = new Set(triggered);
    if (beat.oneShot) nextTriggered.add(beatId);
    set({
      active: { section, node, beatId },
      triggered: nextTriggered,
    });
  },

  firePrefaceIfNeeded: (project) => {
    const { prefaceFired, active } = get();
    if (prefaceFired || active) return;
    const preface = project.sections.find((s) => s.kind === "preface");
    if (!preface) {
      set({ prefaceFired: true });
      return;
    }
    const node = findNode(preface, preface.startId);
    if (!node) {
      set({ prefaceFired: true });
      return;
    }
    set({
      active: { section: preface, node, beatId: null },
      prefaceFired: true,
    });
  },

  chooseChoice: (project, choiceId) => {
    const { active } = get();
    if (!active) return;
    const next = findNode(active.section, choiceId);
    if (!next) {
      // Choice points outside the section — close gracefully.
      set({ active: null });
      return;
    }
    set({ active: { ...active, node: next } });
    // Reference `project` so consumers can later swap to cross-section
    // choices without changing the signature.
    void project;
  },

  endDialogue: () => set({ active: null }),

  markInside: (beatId) => {
    const { inside } = get();
    if (inside.has(beatId)) return;
    const next = new Set(inside);
    next.add(beatId);
    set({ inside: next });
  },

  markOutside: (beatId) => {
    const { inside } = get();
    if (!inside.has(beatId)) return;
    const next = new Set(inside);
    next.delete(beatId);
    set({ inside: next });
  },

  reset: () =>
    set({
      active: null,
      triggered: new Set<string>(),
      inside: new Set<string>(),
      prefaceFired: false,
    }),
}));

function findSection(
  project: ExportedProject,
  sectionName: string,
): ExportedSection | undefined {
  return project.sections.find((s) => s.name === sectionName);
}

function findNode(
  section: ExportedSection,
  nodeId: string,
): ExportedDialogueNode | undefined {
  return section.nodes.find((n) => n.id === nodeId);
}
