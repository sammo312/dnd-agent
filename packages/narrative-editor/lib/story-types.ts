export interface DialogueSegment {
  text: string;
  speed: number;
  style?: {
    color?: string;
    bold?: boolean;
    italic?: boolean;
  };
}

export interface Choice {
  label: string;
  id: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  gltf?: string;
  background?: string;
  music?: string;
  dialogue: DialogueSegment[];
  choices: Choice[];
}

/**
 * A Section is a string of dialogue beats with branching choices.
 * The section ends when a beat has no choices.
 *
 * - `preface`: runs once before the player loads into the map.
 *              Exactly one preface is allowed per project.
 * - `beat`:    triggered when the player walks within radius of a
 *              PlacedNarrativeBeat on the map.
 */
export type SectionKind = 'preface' | 'beat';

export interface Section {
  id: string;
  name: string; // e.g. "intro", "chapter_1", etc.
  title?: string; // Display title e.g. "Awakening"
  start_id: string;
  /** Defaults to 'beat'. */
  kind?: SectionKind;
  // Chapter-level defaults (dialogue nodes can override)
  background?: string;
  music?: string;
  gltf?: string;
}

export interface ExportedDialogue {
  id: string;
  speaker: string;
  gltf?: string;
  background?: string;
  music?: string;
  dialogue: DialogueSegment[];
  choices?: Choice[];
}

export interface ExportedChapterData {
  background?: string;
  music?: string;
  gltf?: string;
  nodes: ExportedDialogue[];
}

export interface ExportedChapter {
  [chapterName: string]: ExportedChapterData;
}

export interface StoryNode {
  id: string;
  type: 'section' | 'dialogue';
  position: { x: number; y: number };
  data: Section | DialogueNode;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface StoryGraph {
  nodes: StoryNode[];
  connections: Connection[];
}
