"use client";

import { ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@dnd-agent/ui/components/tooltip";

/**
 * Top-rail "Open in Player" button. Sits next to Export.
 *
 * The player app is a separate Next.js app (apps/player) deployed as its
 * own Vercel project. Set `NEXT_PUBLIC_PLAYER_URL` in the workbench's
 * environment to wire this button up — e.g. `https://play.example.com`.
 *
 * When the URL is not configured the button stays visible but disabled,
 * with a tooltip explaining what's missing. We deliberately keep the
 * button visible (rather than hiding it) so the affordance is always
 * discoverable.
 */
const PLAYER_URL =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_PLAYER_URL : "";

export function OpenInPlayerButton() {
  const configured = Boolean(PLAYER_URL && PLAYER_URL.length > 0);

  const className =
    "inline-flex items-center gap-1.5 rounded-md border border-amber-700/40 bg-stone-900/90 px-2.5 py-1 font-mono text-xs text-amber-300/90 shadow-sm backdrop-blur-sm transition-colors hover:border-amber-500/60 hover:bg-stone-800 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-amber-700/40 disabled:hover:bg-stone-900/90 disabled:hover:text-amber-300/90";

  if (!configured) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled
              className={className}
              aria-label="Open in player (player URL not configured)"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              <span>Open in player</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            <p className="max-w-[220px] text-pretty">
              Player URL not set. Configure{" "}
              <code className="font-mono text-[11px]">
                NEXT_PUBLIC_PLAYER_URL
              </code>{" "}
              to enable.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <a
      href={PLAYER_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label="Open project in player"
    >
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      <span>Open in player</span>
    </a>
  );
}
