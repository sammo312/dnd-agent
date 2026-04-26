/**
 * Project export — bundles every workbench surface (scene context,
 * characters, story sections, map state, beats, spawn) into a single
 * JSON envelope consumed by the player app.
 *
 * The canonical runtime model:
 *   1. The single 'preface' section runs once on project load.
 *   2. Player spawns onto the map at `map.spawn`.
 *   3. Walking within `radius` of a `map.beats[i]` triggers that
 *      beat's section. `oneShot:true` beats fire once.
 *   4. A section ends when its current dialogue node has no choices.
 */

export const PROJECT_EXPORT_VERSION = 1;

// Loose mirrors of narrative-editor types (kept local so this module
// stays decoupled from that package).
interface SectionLike {
  id: string;
  name: string;
  title?: string;
  start_id: string;
  kind?: 'preface' | 'beat';
  background?: string;
  music?: string;
  gltf?: string;
}
interface DialogueLike {
  id: string;
  speaker: string;
  gltf?: string;
  background?: string;
  music?: string;
  dialogue: Array<{
    text: string;
    speed?: number;
    style?: { color?: string; bold?: boolean; italic?: boolean };
  }>;
  choices?: Array<{ label: string; id: string }>;
}

// ──────────────────────────────────────────────────────────
// Canonical export shape (player-side type contract)
// ──────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────
// Inputs (zustand-store snapshots, kept loose to avoid
// hard cross-package type coupling at the call site)
// ──────────────────────────────────────────────────────────

export interface StoryStoreLike {
  nodes: Array<{
    id: string;
    type: 'section' | 'dialogue';
    data: SectionLike | DialogueLike;
  }>;
}

export interface DmContextLike {
  scene: ExportedScene | null;
  characters: ExportedCharacter[];
}

export interface MapStateLike {
  width: number;
  height: number;
  cells: ExportedMapCell[][];
  pois: ExportedPOI[];
  regions: ExportedRegion[];
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

// ──────────────────────────────────────────────────────────
// Build + validate
// ──────────────────────────────────────────────────────────

export interface ValidationIssue {
  level: 'error' | 'warning';
  message: string;
}

export interface ExportResult {
  project: ExportedProject;
  issues: ValidationIssue[];
  ok: boolean;
}

/**
 * Build the export payload from store snapshots and run validation.
 * Returns the JSON-ready object alongside a list of issues. `ok` is
 * true when there are zero `error`-level issues.
 */
export function buildProject(
  story: StoryStoreLike,
  dm: DmContextLike,
  map: MapStateLike,
): ExportResult {
  const issues: ValidationIssue[] = [];
  const sections = collectSections(story, issues);
  const exportedMap = buildMap(map, sections, issues);

  const project: ExportedProject = {
    version: PROJECT_EXPORT_VERSION,
    meta: {
      title: dm.scene?.title ?? 'Untitled Project',
      summary: dm.scene?.summary,
      exportedAt: new Date().toISOString(),
    },
    scene: dm.scene,
    characters: dm.characters,
    sections,
    map: exportedMap,
  };

  return {
    project,
    issues,
    ok: !issues.some((i) => i.level === 'error'),
  };
}

function collectSections(
  story: StoryStoreLike,
  issues: ValidationIssue[],
): ExportedSection[] {
  const sectionStoreNodes = story.nodes.filter((n) => n.type === 'section');
  const dialogueStoreNodes = story.nodes.filter((n) => n.type === 'dialogue');

  // Map dialogue id -> data for traversal
  const dialogueById = new Map<string, DialogueLike>();
  for (const n of dialogueStoreNodes) {
    const data = n.data as DialogueLike;
    dialogueById.set(data.id, data);
  }

  let prefaceCount = 0;
  const sections: ExportedSection[] = [];

  for (const sectionNode of sectionStoreNodes) {
    const section = sectionNode.data as SectionLike;
    const kind: 'preface' | 'beat' = section.kind ?? 'beat';
    if (kind === 'preface') prefaceCount++;

    const reachable: ExportedDialogueNode[] = [];
    const visited = new Set<string>();
    const queue: string[] = [];
    if (section.start_id) queue.push(section.start_id);

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (!id || visited.has(id)) continue;
      visited.add(id);
      const node = dialogueById.get(id);
      if (!node) {
        issues.push({
          level: 'error',
          message: `Section "${section.name}" references missing dialogue node "${id}".`,
        });
        continue;
      }

      const exported: ExportedDialogueNode = {
        id: node.id,
        speaker: node.speaker,
        dialogue: node.dialogue.map((d) => ({
          text: d.text,
          speed: d.speed,
          style: d.style,
        })),
      };

      // Section-level defaults aren't repeated on each node.
      if (node.gltf && node.gltf !== section.gltf) exported.gltf = node.gltf;
      if (node.background && node.background !== section.background)
        exported.background = node.background;
      if (node.music && node.music !== section.music)
        exported.music = node.music;

      const validChoices = (node.choices ?? []).filter((c) => {
        if (!c.id) {
          issues.push({
            level: 'error',
            message: `Choice "${c.label}" in node "${node.id}" has no target.`,
          });
          return false;
        }
        return true;
      });

      if (validChoices.length > 0) {
        exported.choices = validChoices.map((c) => ({
          label: c.label,
          id: c.id,
        }));
        for (const c of validChoices) {
          if (!visited.has(c.id)) queue.push(c.id);
        }
      }

      reachable.push(exported);
    }

    if (!section.start_id) {
      issues.push({
        level: 'error',
        message: `Section "${section.name}" has no start node.`,
      });
    } else if (reachable.length === 0) {
      issues.push({
        level: 'error',
        message: `Section "${section.name}" is empty (start node "${section.start_id}" is missing).`,
      });
    }

    // Section must have at least one terminal node so it can hand
    // control back to the runtime — otherwise it loops forever.
    const hasTerminal = reachable.some(
      (n) => !n.choices || n.choices.length === 0,
    );
    if (reachable.length > 0 && !hasTerminal) {
      issues.push({
        level: 'warning',
        message: `Section "${section.name}" has no terminal node (every node has choices). The section will never end.`,
      });
    }

    sections.push({
      name: section.name,
      title: section.title,
      kind,
      startId: section.start_id ?? '',
      background: section.background,
      music: section.music,
      gltf: section.gltf,
      nodes: reachable,
    });
  }

  if (prefaceCount === 0) {
    issues.push({
      level: 'error',
      message:
        'No preface section. Every project needs exactly one section with kind:"preface" — it runs before the map loads.',
    });
  } else if (prefaceCount > 1) {
    issues.push({
      level: 'error',
      message: `Multiple preface sections found (${prefaceCount}). Only one is allowed per project.`,
    });
  }

  return sections;
}

function buildMap(
  map: MapStateLike,
  sections: ExportedSection[],
  issues: ValidationIssue[],
): ExportedMap {
  if (!map.spawn) {
    issues.push({
      level: 'error',
      message:
        'No player spawn set. Use the setSpawn tool (or click on the map editor) to pick a tile.',
    });
  }

  const sectionByName = new Map(sections.map((s) => [s.name, s]));

  const exportedBeats: ExportedBeat[] = [];
  for (const b of map.beats) {
    const section = sectionByName.get(b.sectionId);
    if (!section) {
      issues.push({
        level: 'error',
        message: `Beat "${b.name}" at (${b.x},${b.y}) references missing section "${b.sectionId}".`,
      });
      continue;
    }
    if (section.kind !== 'beat') {
      issues.push({
        level: 'error',
        message: `Beat "${b.name}" links to section "${b.sectionId}" which is kind:"${section.kind}". Only kind:"beat" sections can be placed on the map.`,
      });
      continue;
    }
    if (b.nodeId) {
      const exists = section.nodes.some((n) => n.id === b.nodeId);
      if (!exists) {
        issues.push({
          level: 'error',
          message: `Beat "${b.name}" points at node "${b.nodeId}", which doesn't exist in section "${b.sectionId}".`,
        });
      }
    }
    if (
      map.spawn &&
      Math.abs(b.x - map.spawn.x) +
        Math.abs(b.y - map.spawn.y) <=
        (b.radius ?? 1)
    ) {
      issues.push({
        level: 'warning',
        message: `Beat "${b.name}" at (${b.x},${b.y}) overlaps the player spawn — it will fire immediately on load.`,
      });
    }
    exportedBeats.push({
      id: b.id,
      sectionName: b.sectionId,
      nodeId: b.nodeId,
      name: b.name,
      x: b.x,
      y: b.y,
      radius: typeof b.radius === 'number' ? b.radius : 1,
      oneShot: b.oneShot ?? true,
    });
  }

  // Warn on beat-kind sections with no map placement — they're unreachable.
  for (const s of sections) {
    if (s.kind !== 'beat') continue;
    const placed = exportedBeats.some((b) => b.sectionName === s.name);
    if (!placed) {
      issues.push({
        level: 'warning',
        message: `Section "${s.name}" (kind:beat) is not placed on the map — it will never trigger. Use placeBeat to wire it up.`,
      });
    }
  }

  return {
    width: map.width,
    height: map.height,
    cells: map.cells,
    pois: map.pois,
    regions: map.regions,
    spawn: map.spawn ?? { x: 0, y: 0 },
    beats: exportedBeats,
  };
}

/** Trigger a browser download of the project JSON. */
export function downloadProject(project: ExportedProject, filename?: string) {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = (project.meta.title || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
  a.download = filename ?? `${safeTitle || 'project'}.dnd.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
