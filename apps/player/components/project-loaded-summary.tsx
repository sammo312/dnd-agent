"use client";

/**
 * Acknowledgement screen shown right after a successful import.
 *
 * Confirms that the player has actually consumed the workbench's JSON
 * — not just by saying "loaded" but by reading back the contents
 * (title, summary, character / section / beat counts, map size, spawn).
 * If any of these look wrong, the DM knows there's a contract drift to
 * chase before they enter the scene.
 *
 * "Enter scene" hands off to the existing 3D scene; "Load different
 * project" clears the store and bounces back to the import screen.
 */

import { useProjectStore } from "@/lib/project/project-store";

export interface ProjectLoadedSummaryProps {
  onEnter: () => void;
}

export function ProjectLoadedSummary({ onEnter }: ProjectLoadedSummaryProps) {
  const project = useProjectStore((s) => s.project);
  const filename = useProjectStore((s) => s.filename);
  const clear = useProjectStore((s) => s.clear);

  if (!project) return null;

  const prefaceCount = project.sections.filter(
    (s) => s.kind === "preface",
  ).length;
  const beatSectionCount = project.sections.filter(
    (s) => s.kind === "beat",
  ).length;
  const totalNodes = project.sections.reduce(
    (sum, s) => sum + s.nodes.length,
    0,
  );

  const stats: Array<{ label: string; value: string }> = [
    {
      label: "characters",
      value: String(project.characters.length),
    },
    {
      label: "sections",
      value: `${project.sections.length} (${prefaceCount} preface, ${beatSectionCount} beat)`,
    },
    {
      label: "dialogue nodes",
      value: String(totalNodes),
    },
    {
      label: "map",
      value: `${project.map.width} × ${project.map.height}`,
    },
    {
      label: "pois",
      value: String(project.map.pois.length),
    },
    {
      label: "regions",
      value: String(project.map.regions.length),
    },
    {
      label: "beats placed",
      value: String(project.map.beats.length),
    },
    {
      label: "spawn",
      value: `(${project.map.spawn.x}, ${project.map.spawn.y})`,
    },
  ];

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[oklch(0.11_0.01_70)] text-[oklch(0.88_0.03_80)] p-6">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="font-mono text-xs text-[oklch(0.78_0.16_75)]">
            project loaded
            {filename ? (
              <span className="ml-2 text-[oklch(0.50_0.02_70)]">
                · {filename}
              </span>
            ) : null}
          </p>
          <h1 className="font-mono text-2xl font-bold leading-tight">
            {project.meta.title || "Untitled Project"}
          </h1>
          {project.meta.summary || project.scene?.summary ? (
            <p className="text-sm leading-relaxed text-[oklch(0.50_0.02_70)]">
              {project.meta.summary ?? project.scene?.summary}
            </p>
          ) : null}
        </header>

        <section
          aria-label="Project contents"
          className="rounded-sm border border-[oklch(0.22_0.01_70)] bg-[oklch(0.15_0.01_70)] p-4"
        >
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-xs">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <dt className="text-[oklch(0.50_0.02_70)]">{stat.label}</dt>
                <dd
                  className="text-[oklch(0.88_0.03_80)] tabular-nums"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {project.characters.length > 0 ? (
          <section
            aria-label="Characters"
            className="rounded-sm border border-[oklch(0.22_0.01_70)] bg-[oklch(0.15_0.01_70)] p-4"
          >
            <p className="font-mono text-xs text-[oklch(0.50_0.02_70)] mb-2">
              cast
            </p>
            <ul className="space-y-1.5 font-mono text-xs">
              {project.characters.slice(0, 8).map((c) => (
                <li
                  key={c.id}
                  className="flex items-baseline gap-2 leading-relaxed"
                >
                  <span
                    className={
                      c.role === "pc"
                        ? "text-[oklch(0.78_0.16_75)] w-12 shrink-0"
                        : c.role === "antagonist"
                          ? "text-[oklch(0.52_0.19_25)] w-12 shrink-0"
                          : "text-[oklch(0.68_0.12_195)] w-12 shrink-0"
                    }
                  >
                    {c.role}
                  </span>
                  <span className="text-[oklch(0.88_0.03_80)]">{c.name}</span>
                </li>
              ))}
              {project.characters.length > 8 ? (
                <li className="text-[oklch(0.50_0.02_70)]">
                  · …and {project.characters.length - 8} more
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={clear}
            className="font-mono text-xs text-[oklch(0.50_0.02_70)] hover:text-[oklch(0.88_0.03_80)] transition-colors underline-offset-2 hover:underline"
          >
            load different project
          </button>
          <button
            type="button"
            onClick={onEnter}
            className="rounded-sm border border-[oklch(0.78_0.16_75)]/60 bg-[oklch(0.78_0.16_75)]/10 px-4 py-2 font-mono text-sm text-[oklch(0.78_0.16_75)] transition-colors hover:bg-[oklch(0.78_0.16_75)]/20"
            style={{
              textShadow: "0 0 8px oklch(0.78 0.16 75 / 0.30)",
            }}
          >
            enter scene →
          </button>
        </div>

        <footer className="font-mono text-[10px] text-[oklch(0.35_0.01_70)] leading-relaxed">
          export v{project.version} · written{" "}
          {formatExportedAt(project.meta.exportedAt)}
        </footer>
      </div>
    </main>
  );
}

function formatExportedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}
