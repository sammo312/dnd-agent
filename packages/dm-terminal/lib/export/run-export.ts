/**
 * Shared orchestration for "build the project from the live store state,
 * validate it, and (optionally) download it." Used by both the terminal's
 * /export slash command and the workbench's Export button so they go
 * through exactly one code path.
 *
 * Lives at the dm-terminal layer because that's the only package that
 * already imports all three stores. The function is React-free; UIs are
 * responsible for displaying the returned summary however they like
 * (toast, terminal output, modal, etc.).
 */

import { useStoryStore } from "@dnd-agent/narrative-editor";
import { useMapStore } from "@dnd-agent/map-editor";
import { useDmContextStore } from "../dm-context-store";
import { buildProject, downloadProject } from "./project-export";

export interface ProjectExportSummary {
  /** True iff the validator produced zero errors. */
  ok: boolean;
  /** True iff a JSON download was actually triggered (ok || force). */
  downloaded: boolean;
  errors: string[];
  warnings: string[];
}

export interface RunProjectExportOptions {
  /** Download the file even when validation produced errors. */
  force?: boolean;
}

/**
 * Pulls the current state of the three workbench stores, asks the export
 * module to build + validate the canonical project JSON, and triggers a
 * browser download if validation passed (or `force` was set).
 *
 * Safe to call in React effects, handlers, and slash-command routers —
 * it never throws; failures are surfaced via the returned summary.
 */
export function runProjectExport(
  opts: RunProjectExportOptions = {},
): ProjectExportSummary {
  const story = useStoryStore.getState();
  const dm = useDmContextStore.getState();
  const mapExport = useMapStore.getState().exportSnapshot;

  if (!mapExport) {
    return {
      ok: false,
      downloaded: false,
      errors: [
        "Map state hasn't been published yet. Open the Map Editor tab once and try again.",
      ],
      warnings: [],
    };
  }

  const result = buildProject(
    { nodes: story.nodes },
    {
      scene: dm.scene,
      characters: dm.characters.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        description: c.description,
        motivation: c.motivation,
      })),
    },
    mapExport,
  );

  const errors = result.issues
    .filter((i) => i.level === "error")
    .map((i) => i.message);
  const warnings = result.issues
    .filter((i) => i.level === "warning")
    .map((i) => i.message);

  const shouldDownload = result.ok || !!opts.force;
  if (shouldDownload) {
    downloadProject(result.project);
  }

  return {
    ok: result.ok,
    downloaded: shouldDownload,
    errors,
    warnings,
  };
}
