"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { runProjectExport } from "@dnd-agent/dm-terminal";

/**
 * Top-right Export button. Runs the same `runProjectExport()` orchestrator
 * the terminal's `/export` slash command uses, so behaviour stays in lockstep.
 *
 * - Success → success toast + the JSON file is downloaded.
 * - Errors  → error toast with count and a hint to inspect /export in the
 *             terminal (which prints each error line). We deliberately do
 *             NOT auto-force here — the terminal's `/export -f` is the
 *             escape hatch.
 * - Warnings → info toast appended to the success message.
 */
export function ExportButton() {
  const [running, setRunning] = useState(false);

  const handleClick = () => {
    if (running) return;
    setRunning(true);
    // Defer to next tick so the spinner can render before the (synchronous)
    // build + validate work runs.
    requestAnimationFrame(() => {
      try {
        const summary = runProjectExport();

        if (summary.downloaded) {
          if (summary.warnings.length > 0) {
            toast.success("Exported project.dnd.json", {
              description: `${summary.warnings.length} warning${summary.warnings.length === 1 ? "" : "s"} — see /export in terminal for details.`,
            });
          } else {
            toast.success("Exported project.dnd.json");
          }
        } else {
          toast.error(
            `Export blocked — ${summary.errors.length} error${summary.errors.length === 1 ? "" : "s"}`,
            {
              description:
                summary.errors[0] ??
                "Run /export in the terminal for the full report.",
              action: {
                label: "Force",
                onClick: () => {
                  const forced = runProjectExport({ force: true });
                  if (forced.downloaded) {
                    toast.success("Exported project.dnd.json (forced)", {
                      description: `${forced.errors.length} error${forced.errors.length === 1 ? "" : "s"} carried over — review before sharing.`,
                    });
                  }
                },
              },
            },
          );
        }
      } finally {
        setRunning(false);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={running}
      className="absolute right-3 top-1.5 z-50 inline-flex items-center gap-1.5 rounded-md border border-amber-700/40 bg-stone-900/90 px-2.5 py-1 font-mono text-xs text-amber-300/90 shadow-sm backdrop-blur-sm transition-colors hover:border-amber-500/60 hover:bg-stone-800 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="Export project as JSON"
    >
      {running ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        <Download className="h-3.5 w-3.5" aria-hidden />
      )}
      <span>Export</span>
    </button>
  );
}
