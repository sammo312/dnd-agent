"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { runProjectExport } from "@dnd-agent/dm-terminal";
import { ExportSuccessDialog } from "./export-success-dialog";

/**
 * Top-right Export button. Runs the same `runProjectExport()` orchestrator
 * the terminal's `/export` slash command uses, so behaviour stays in lockstep.
 *
 * - Success → file downloads immediately + a celebration dialog opens
 *             showing the next steps (open player, drop the JSON).
 * - Errors  → error toast with count and a Force action that re-runs
 *             with `force: true` and opens the celebration dialog with
 *             a warning advisory.
 */
export function ExportButton() {
  const [running, setRunning] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successWarnings, setSuccessWarnings] = useState(0);

  const showSuccess = (warningCount: number) => {
    setSuccessWarnings(warningCount);
    setSuccessOpen(true);
  };

  const handleClick = () => {
    if (running) return;
    setRunning(true);
    // Defer to next tick so the spinner can render before the (synchronous)
    // build + validate work runs.
    requestAnimationFrame(() => {
      try {
        const summary = runProjectExport();

        if (summary.downloaded) {
          showSuccess(summary.warnings.length);
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
                    showSuccess(forced.errors.length + forced.warnings.length);
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
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={running}
        className="inline-flex items-center gap-1.5 rounded-md border border-amber-700/40 bg-stone-900/90 px-2.5 py-1 font-mono text-xs text-amber-300/90 shadow-sm backdrop-blur-sm transition-colors hover:border-amber-500/60 hover:bg-stone-800 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Export project as JSON"
      >
        {running ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Download className="h-3.5 w-3.5" aria-hidden />
        )}
        {/* Drop the label below the sm breakpoint so the button fits
         * the mobile header without crowding "Open in player". The
         * aria-label on the button keeps the action discoverable. */}
        <span className="hidden sm:inline">Export</span>
      </button>
      <ExportSuccessDialog
        open={successOpen}
        onOpenChange={setSuccessOpen}
        warningCount={successWarnings}
      />
    </>
  );
}
