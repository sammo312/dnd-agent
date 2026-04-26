/**
 * Player-side parser + validator for the canonical `project.dnd.json`
 * envelope written by the workbench's Export button.
 *
 * The shape comes from `@dnd-agent/shared/types/project-export` — this
 * file mirrors that contract in Zod so we can validate untrusted JSON
 * (a file the user dragged onto the page) before letting it touch the
 * runtime.
 *
 * Returns a discriminated union: `{ ok: true, project }` on success, or
 * `{ ok: false, errors }` with human-readable messages on failure.
 */

import { z } from "zod";
import {
  PROJECT_EXPORT_VERSION,
  type ExportedProject,
} from "@dnd-agent/shared/types/project-export";

// ──────────────────────────────────────────────────────────
// Zod schema (mirrors the TS contract)
// ──────────────────────────────────────────────────────────

const dialogueSegmentSchema = z.object({
  text: z.string(),
  speed: z.number().optional(),
  style: z
    .object({
      color: z.string().optional(),
      bold: z.boolean().optional(),
      italic: z.boolean().optional(),
    })
    .optional(),
});

const choiceSchema = z.object({
  label: z.string(),
  id: z.string(),
});

const dialogueNodeSchema = z.object({
  id: z.string(),
  speaker: z.string(),
  dialogue: z.array(dialogueSegmentSchema),
  choices: z.array(choiceSchema).optional(),
  background: z.string().optional(),
  music: z.string().optional(),
  gltf: z.string().optional(),
});

const sectionSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  kind: z.enum(["preface", "beat"]),
  startId: z.string(),
  background: z.string().optional(),
  music: z.string().optional(),
  gltf: z.string().optional(),
  nodes: z.array(dialogueNodeSchema),
});

const beatSchema = z.object({
  id: z.string(),
  sectionName: z.string(),
  nodeId: z.string().optional(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  radius: z.number(),
  oneShot: z.boolean(),
});

const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(["pc", "npc", "antagonist"]),
  description: z.string(),
  motivation: z.string().optional(),
});

const mapCellSchema = z.object({
  terrain: z.string(),
  elevation: z.number(),
  elevationOffset: z.number().optional(),
  regionId: z.string().optional(),
});

const poiSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  icon: z.string(),
  x: z.number(),
  y: z.number(),
  size: z.object({ w: z.number(), h: z.number() }),
  gltfUrl: z.string().optional(),
});

const regionSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  pixels: z.array(z.object({ x: z.number(), y: z.number() })),
});

const mapSchema = z.object({
  width: z.number(),
  height: z.number(),
  cells: z.array(z.array(mapCellSchema)),
  pois: z.array(poiSchema),
  regions: z.array(regionSchema),
  spawn: z.object({ x: z.number(), y: z.number() }),
  beats: z.array(beatSchema),
});

const sceneSchema = z
  .object({
    title: z.string().optional(),
    pitch: z.string().optional(),
    summary: z.string().optional(),
    tone: z.string().optional(),
    setting: z.string().optional(),
  })
  .nullable();

const projectSchema = z.object({
  version: z.number(),
  meta: z.object({
    title: z.string(),
    summary: z.string().optional(),
    exportedAt: z.string(),
  }),
  scene: sceneSchema,
  characters: z.array(characterSchema),
  sections: z.array(sectionSchema),
  map: mapSchema,
});

// ──────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────

export type ParseProjectResult =
  | { ok: true; project: ExportedProject }
  | { ok: false; errors: string[] };

/**
 * Validate an untrusted value (e.g. JSON.parse output from a dropped
 * file) against the project-export contract. Always resolves — never
 * throws.
 *
 * Errors include:
 *  - JSON-level shape mismatches (Zod issues, formatted with the path)
 *  - Version mismatches (we only understand `PROJECT_EXPORT_VERSION`)
 *  - Cross-field semantic checks (preface count, beat → section refs,
 *    spawn-in-bounds) so we surface workbench bugs early instead of
 *    crashing the runtime later.
 */
export function parseProject(input: unknown): ParseProjectResult {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    });
    return { ok: false, errors };
  }

  const project = parsed.data as ExportedProject;
  const semantic = validateSemantics(project);
  if (semantic.length > 0) {
    return { ok: false, errors: semantic };
  }

  return { ok: true, project };
}

/**
 * Convenience wrapper for the drop-file flow: takes raw text, runs
 * `JSON.parse` defensively, then `parseProject`.
 */
export function parseProjectFromText(text: string): ParseProjectResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      errors: [`This doesn't look like JSON: ${message}`],
    };
  }
  return parseProject(raw);
}

function validateSemantics(project: ExportedProject): string[] {
  const errors: string[] = [];

  if (project.version !== PROJECT_EXPORT_VERSION) {
    errors.push(
      `Unsupported export version ${project.version}. This player understands version ${PROJECT_EXPORT_VERSION}. Re-export from a matching workbench build.`,
    );
    // Bail early — past the version line all other semantic checks are
    // best-effort and may be misleading on a future-format file.
    return errors;
  }

  const prefaces = project.sections.filter((s) => s.kind === "preface");
  if (prefaces.length === 0) {
    errors.push(
      'No preface section found. Every project needs exactly one section with kind:"preface".',
    );
  } else if (prefaces.length > 1) {
    errors.push(
      `Multiple preface sections (${prefaces.length}). Only one is allowed.`,
    );
  }

  const sectionByName = new Map(project.sections.map((s) => [s.name, s]));

  for (const section of project.sections) {
    const ids = new Set(section.nodes.map((n) => n.id));
    if (section.startId && !ids.has(section.startId)) {
      errors.push(
        `Section "${section.name}" startId "${section.startId}" is not in its node list.`,
      );
    }
    for (const node of section.nodes) {
      for (const choice of node.choices ?? []) {
        if (!ids.has(choice.id)) {
          errors.push(
            `Section "${section.name}" node "${node.id}" choice "${choice.label}" targets unknown node "${choice.id}".`,
          );
        }
      }
    }
  }

  const { width, height, spawn, beats } = project.map;
  if (
    spawn.x < 0 ||
    spawn.x >= width ||
    spawn.y < 0 ||
    spawn.y >= height
  ) {
    errors.push(
      `Spawn (${spawn.x}, ${spawn.y}) is outside the ${width}×${height} map.`,
    );
  }

  for (const beat of beats) {
    const section = sectionByName.get(beat.sectionName);
    if (!section) {
      errors.push(
        `Beat "${beat.name}" references unknown section "${beat.sectionName}".`,
      );
      continue;
    }
    if (section.kind !== "beat") {
      errors.push(
        `Beat "${beat.name}" links to section "${beat.sectionName}" with kind:"${section.kind}". Only kind:"beat" sections can be placed on the map.`,
      );
    }
    if (beat.nodeId && !section.nodes.some((n) => n.id === beat.nodeId)) {
      errors.push(
        `Beat "${beat.name}" points at node "${beat.nodeId}", which doesn't exist in section "${beat.sectionName}".`,
      );
    }
    if (beat.x < 0 || beat.x >= width || beat.y < 0 || beat.y >= height) {
      errors.push(
        `Beat "${beat.name}" at (${beat.x}, ${beat.y}) is outside the ${width}×${height} map.`,
      );
    }
  }

  return errors;
}
