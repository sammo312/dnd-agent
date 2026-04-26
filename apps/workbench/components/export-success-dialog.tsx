"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@dnd-agent/ui/components/dialog";
import { Button } from "@dnd-agent/ui/components/button";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileJson,
  Loader2,
} from "lucide-react";
import { runProjectExport } from "@dnd-agent/dm-terminal";
import { toast } from "sonner";

/**
 * Where the "Open Player" CTA points. The player app isn't published yet,
 * so for now this opens a placeholder. Swap this URL once the player app
 * is live (e.g. `https://player.your-domain.com` or a relative `/player`).
 */
const PLAYER_APP_URL = "#open-player-app";

export interface ExportSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Number of validation warnings carried over from the export. Shown as
   * a small advisory under the success header so the DM knows the file
   * shipped but isn't perfect.
   */
  warningCount?: number;
}

/**
 * Celebration + next-step prompt that opens after a successful export.
 *
 * The file has already been downloaded by the time this renders — the
 * dialog's job is to (a) confirm it, (b) tell the DM where to take it
 * next, and (c) provide a re-download fallback in case the browser ate
 * the file or they dismissed without noticing.
 */
export function ExportSuccessDialog({
  open,
  onOpenChange,
  warningCount = 0,
}: ExportSuccessDialogProps) {
  const [redownloading, setRedownloading] = useState(false);

  const handleRedownload = () => {
    if (redownloading) return;
    setRedownloading(true);
    requestAnimationFrame(() => {
      try {
        const summary = runProjectExport({ force: true });
        if (summary.downloaded) {
          toast.success("Re-downloaded project.dnd.json");
        } else {
          toast.error("Re-download failed", {
            description: summary.errors[0] ?? "Run /export in the terminal.",
          });
        }
      } finally {
        setRedownloading(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-500/30">
              <CheckCircle2
                className="h-5 w-5 text-amber-400"
                aria-hidden="true"
              />
            </div>
            <DialogTitle className="text-lg">
              Your scene is ready to play
            </DialogTitle>
          </div>
          <DialogDescription className="text-pretty leading-relaxed">
            We&apos;ve packed everything — story, map, and characters — into a
            single JSON file. Bring it over to the player app and your party
            is good to go.
          </DialogDescription>
        </DialogHeader>

        {/* Filename callout */}
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5">
          <FileJson
            className="h-4 w-4 shrink-0 text-amber-400"
            aria-hidden="true"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-mono text-sm leading-tight">
              project.dnd.json
            </span>
            <span className="text-xs text-muted-foreground leading-tight">
              Saved to your downloads
              {warningCount > 0 ? (
                <span className="ml-1.5 text-amber-400/80">
                  · {warningCount} warning{warningCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleRedownload}
            disabled={redownloading}
            className="shrink-0 gap-1.5 text-xs"
          >
            {redownloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Download className="h-3.5 w-3.5" aria-hidden />
            )}
            <span>Save again</span>
          </Button>
        </div>

        {/* Two-step instructions */}
        <ol className="space-y-2.5">
          <li className="flex gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-800 font-mono text-xs text-amber-300 ring-1 ring-amber-500/30"
              aria-hidden="true"
            >
              1
            </span>
            <span className="pt-0.5 text-sm leading-relaxed">
              Open the player app in a new tab.
            </span>
          </li>
          <li className="flex gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-800 font-mono text-xs text-amber-300 ring-1 ring-amber-500/30"
              aria-hidden="true"
            >
              2
            </span>
            <span className="pt-0.5 text-sm leading-relaxed">
              Drop{" "}
              <span className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                project.dnd.json
              </span>{" "}
              onto its import area to start the session.
            </span>
          </li>
        </ol>

        {/* CTAs */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Keep iterating
          </Button>
          <Button
            type="button"
            asChild
            className="gap-2 bg-amber-500 text-stone-950 hover:bg-amber-400"
          >
            <a
              href={PLAYER_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpenChange(false)}
            >
              Open Player
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
