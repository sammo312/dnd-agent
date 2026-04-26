"use client";

import { useEffect } from "react";
import { ArrowUpRight, Check, HelpCircle, X } from "lucide-react";

/* ─────────────────────────────────────────────
 * Local utilities — this package is standalone so we don't import
 * shared `cn` helpers from the consuming app.
 * ───────────────────────────────────────────── */
function cn(
  ...args: (string | false | undefined | null)[]
): string {
  return args.filter(Boolean).join(" ");
}

/* ─────────────────────────────────────────────
 * Status pip — small dot used to show tool-call state inline.
 * ───────────────────────────────────────────── */
type ToolStatus = "running" | "done" | "error";

export function ToolStatusDot({
  state,
  className,
}: {
  state: ToolStatus;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-1.5 rounded-full shrink-0",
        state === "running" &&
          "bg-[var(--accent-amber)] animate-pulse-glow",
        state === "done" &&
          "bg-[var(--accent-green)]",
        state === "error" && "bg-[var(--accent-crimson)]",
        className
      )}
    />
  );
}

/* ─────────────────────────────────────────────
 * Generic tool-call line. Renders a one-liner like:
 *
 *   • setSceneContext   The Bone Orchard
 *
 * Used for all worldbuilding tools (paintTerrain, addCharacter, etc.).
 * ───────────────────────────────────────────── */

const TOOL_LABELS: Record<string, string> = {
  setSceneContext: "scene",
  addCharacter: "character",
  createChapter: "chapter",
  addDialogueNode: "dialogue",
  setMapDimensions: "map size",
  paintTerrain: "terrain",
  addPOI: "poi",
  rollDice: "roll",
  askQuestion: "question",
  linkToSurface: "link",
};

function summarizeArgs(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "setSceneContext":
      return String(args.title ?? "");
    case "addCharacter":
      return `${args.name} (${args.role})`;
    case "createChapter":
      return String(args.title ?? args.name ?? "");
    case "addDialogueNode":
      return `${args.chapterName}/${args.nodeId}`;
    case "setMapDimensions":
      return `${args.width}×${args.height}${args.reset ? " · reset" : ""}`;
    case "paintTerrain":
      return `${args.terrain} (${args.x1},${args.y1})→(${args.x2},${args.y2})`;
    case "addPOI":
      return `${args.name} @ ${args.x},${args.y}`;
    case "rollDice":
      return String(args.notation ?? "");
    default:
      return "";
  }
}

export function ToolLine({
  name,
  args,
  status,
}: {
  name: string;
  args: Record<string, unknown>;
  status: ToolStatus;
}) {
  return (
    <div
      className="font-mono text-xs flex items-center gap-2 text-muted-foreground py-0.5 leading-relaxed"
      role="status"
    >
      <ToolStatusDot state={status} />
      <span className="text-foreground/70 tabular-nums">
        {TOOL_LABELS[name] ?? name}
      </span>
      <span className="text-muted-foreground/80 truncate">
        {summarizeArgs(name, args)}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Dice roll result card — emphasizes the total.
 * ───────────────────────────────────────────── */
export function DiceLine({
  notation,
  rolls,
  modifier,
  total,
  reason,
}: {
  notation: string;
  rolls: number[];
  modifier: number;
  total: number;
  reason?: string;
}) {
  return (
    <div className="font-mono text-sm flex items-center gap-2 py-0.5 leading-relaxed">
      <ToolStatusDot state="done" />
      <span className="text-muted-foreground tabular-nums">{notation}</span>
      <span className="text-muted-foreground/60">→</span>
      <span className="text-[var(--accent-amber)] text-glow-amber font-medium tabular-nums">
        {total}
      </span>
      {reason ? (
        <span className="text-muted-foreground/80 text-xs">({reason})</span>
      ) : null}
      <span className="text-muted-foreground/40 text-xs ml-auto tabular-nums">
        [{rolls.join(", ")}
        {modifier !== 0 ? ` ${modifier > 0 ? "+" : ""}${modifier}` : ""}]
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Choice picker — rendered when the agent calls askQuestion.
 *
 * - 2-5 selectable choices, sharp-cornered, hover state highlights amber.
 * - Number hotkeys (1-5) trigger the corresponding choice.
 * - After a pick, picker collapses to show the selected option dimmed.
 * ───────────────────────────────────────────── */

export interface ChoiceData {
  label: string;
  detail?: string;
}

export function ChoicePicker({
  question,
  choices,
  selected,
  onPick,
  active,
}: {
  question: string;
  choices: ChoiceData[];
  selected: number | null;
  onPick: (index: number) => void;
  active: boolean;
}) {
  // Keyboard hotkeys (1–5) while the picker is unanswered.
  useEffect(() => {
    if (!active || selected !== null) return;
    const handler = (e: KeyboardEvent) => {
      // Don't hijack typing in the prompt input.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const n = parseInt(e.key, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= choices.length) {
        e.preventDefault();
        onPick(n - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, selected, choices.length, onPick]);

  return (
    <div className="font-mono my-1 border-l-2 border-[var(--accent-amber)]/60 pl-3 py-1">
      <div className="flex items-center gap-2 text-sm text-foreground mb-2">
        <HelpCircle className="size-3.5 text-[var(--accent-amber)] shrink-0" />
        <span>{question}</span>
      </div>
      <div className="flex flex-col gap-px">
        {choices.map((c, i) => {
          const isSelected = selected === i;
          const isDisabled = selected !== null && !isSelected;
          return (
            <button
              key={i}
              type="button"
              disabled={selected !== null}
              onClick={() => onPick(i)}
              className={cn(
                "group flex items-start gap-3 px-2 py-1.5 text-left text-sm transition-colors",
                "border-l border-transparent",
                !isSelected &&
                  !isDisabled &&
                  "hover:bg-muted/40 hover:border-[var(--accent-amber)]/60 cursor-pointer",
                isSelected &&
                  "bg-[var(--accent-amber)]/10 border-[var(--accent-amber)]/60",
                isDisabled && "opacity-30 cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "shrink-0 mt-0.5 text-xs tabular-nums w-4",
                  isSelected
                    ? "text-[var(--accent-amber)]"
                    : "text-muted-foreground/60 group-hover:text-[var(--accent-amber)]"
                )}
              >
                {i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span
                  className={cn(
                    "block",
                    isSelected
                      ? "text-[var(--accent-amber)] text-glow-amber"
                      : "text-foreground"
                  )}
                >
                  {c.label}
                </span>
                {c.detail ? (
                  <span className="block text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">
                    {c.detail}
                  </span>
                ) : null}
              </span>
              {isSelected ? (
                <Check className="size-3.5 text-[var(--accent-amber)] shrink-0 mt-1" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Surface link — clickable card that focuses a workbench panel.
 * ───────────────────────────────────────────── */

const SURFACE_LABELS: Record<string, string> = {
  map: "map editor",
  story: "story boarder",
};

export function SurfaceLinkCard({
  surface,
  summary,
  onOpen,
}: {
  surface: "map" | "story";
  summary: string;
  onOpen: (surface: "map" | "story") => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(surface)}
      className={cn(
        "group flex items-center justify-between gap-3 w-full",
        "px-3 py-2 text-left",
        "bg-card border border-border",
        "hover:bg-[var(--bg-elevated)] hover:border-[var(--accent-amber)]/50",
        "transition-colors my-1"
      )}
      style={{ borderRadius: "2px" }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <ArrowUpRight className="size-3.5 text-[var(--accent-amber)] shrink-0" />
        <div className="min-w-0">
          <div className="font-mono text-[11px] text-muted-foreground uppercase-off tracking-wide">
            {SURFACE_LABELS[surface]}
          </div>
          <div className="font-mono text-sm text-foreground truncate">
            {summary}
          </div>
        </div>
      </div>
      <span className="font-mono text-xs text-muted-foreground/60 group-hover:text-[var(--accent-amber)] transition-colors shrink-0">
        view →
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────
 * Generic error rendering for failed tool calls.
 * ───────────────────────────────────────────── */
export function ToolErrorLine({ message }: { message: string }) {
  return (
    <div className="font-mono text-xs flex items-center gap-2 py-0.5 leading-relaxed text-[var(--accent-crimson)]">
      <X className="size-3" />
      <span>{message}</span>
    </div>
  );
}
