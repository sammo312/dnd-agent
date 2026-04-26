"use client";

/**
 * Fullscreen dialogue UX, fired by:
 *   - Auto-running the project's preface section on first scene mount.
 *   - Walking into a beat's `radius` while in FPS mode.
 *
 * Behaviour:
 *   - Each segment types out at its declared `speed` (ms-per-char),
 *     respecting per-segment `style.color`.
 *   - Click anywhere (or press space / enter) to skip the typewriter
 *     and reveal the full node immediately.
 *   - Once fully revealed:
 *       · choices present → stack of choice buttons, click to advance
 *         to the target node id within the same section.
 *       · no choices → "Continue" button ends the section.
 *   - Escape always closes the overlay (the section is dropped, the
 *     player resumes movement).
 *
 * Styling matches DESIGN.md: warm near-blacks, amber accent, JetBrains
 * mono for labels, sharp corners (`rounded-sm`).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ExportedDialogueNode,
  ExportedDialogueSegment,
  ExportedProject,
} from "@dnd-agent/shared";
import { useNarrativeStore } from "@/lib/narrative/narrative-store";
import { useTouchDevice } from "@/lib/input/use-touch-device";

interface DialogueOverlayProps {
  project: ExportedProject;
}

export function DialogueOverlay({ project }: DialogueOverlayProps) {
  const active = useNarrativeStore((s) => s.active);
  const chooseChoice = useNarrativeStore((s) => s.chooseChoice);
  const endDialogue = useNarrativeStore((s) => s.endDialogue);

  if (!active) return null;

  return (
    <DialogueRunner
      key={`${active.section.name}:${active.node.id}`}
      project={project}
      node={active.node}
      sectionTitle={active.section.title ?? active.section.name}
      onChoose={(choiceId) => chooseChoice(project, choiceId)}
      onClose={endDialogue}
    />
  );
}

interface DialogueRunnerProps {
  project: ExportedProject;
  node: ExportedDialogueNode;
  sectionTitle: string;
  onChoose: (choiceId: string) => void;
  onClose: () => void;
}

/**
 * Per-node runner. Lifted out so we can `key` on section:node and let
 * React unmount/remount it cleanly when the player advances — that
 * resets the typewriter state without us having to wire a reset
 * effect.
 */
function DialogueRunner({
  node,
  sectionTitle,
  onChoose,
  onClose,
}: DialogueRunnerProps) {
  const segments = node.dialogue;
  const isTouch = useTouchDevice();

  const totalChars = useMemo(
    () => segments.reduce((acc, seg) => acc + seg.text.length, 0),
    [segments],
  );

  // Charactersrevealed counter, advanced by a per-segment timer using
  // each segment's declared `speed` (ms-per-char). Click-to-skip just
  // jumps the counter to totalChars.
  const [revealed, setRevealed] = useState(0);
  const finished = revealed >= totalChars;

  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setRevealed(0);
    startedAtRef.current = null;

    const tick = (now: number) => {
      if (startedAtRef.current === null) startedAtRef.current = now;
      const elapsed = now - startedAtRef.current;

      // Walk segments left-to-right; the first one not fully revealed
      // determines how many of *its* chars are visible right now.
      let count = 0;
      let consumed = 0;
      let done = true;
      for (const seg of segments) {
        const segDuration = seg.text.length * (seg.speed ?? 30);
        if (elapsed >= consumed + segDuration) {
          count += seg.text.length;
          consumed += segDuration;
          continue;
        }
        const within = Math.max(0, elapsed - consumed);
        const chars = Math.min(
          seg.text.length,
          Math.floor(within / (seg.speed ?? 30)),
        );
        count += chars;
        done = false;
        break;
      }

      setRevealed(count);
      if (!done) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [segments]);

  const skipToEnd = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    setRevealed(totalChars);
  }, [totalChars]);

  const advanceOrClose = useCallback(() => {
    if (!finished) {
      skipToEnd();
      return;
    }
    // Finished node: if there are choices, the player has to pick one.
    if (node.choices && node.choices.length > 0) return;
    onClose();
  }, [finished, node.choices, onClose, skipToEnd]);

  // Keyboard: space/enter to skip-or-advance, escape to bail.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advanceOrClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advanceOrClose, onClose]);

  const visibleSegments = sliceSegments(segments, revealed);
  const showChoices =
    finished && node.choices && node.choices.length > 0
      ? node.choices
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${sectionTitle}: ${node.speaker}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[oklch(0.11_0.01_70)]/85 backdrop-blur-sm"
      onClick={advanceOrClose}
    >
      <div
        className="relative w-full max-w-3xl m-4 sm:m-8 flex flex-col gap-5 rounded-sm border border-[oklch(0.22_0.01_70)] bg-[oklch(0.13_0.01_70)] px-6 py-7 sm:px-10 sm:py-9 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.50_0.02_70)]">
              {sectionTitle}
            </p>
            <p className="font-mono text-sm text-[oklch(0.78_0.16_75)]">
              {node.speaker}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialogue"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.50_0.02_70)] hover:text-[oklch(0.88_0.03_80)] transition-colors"
            style={{ touchAction: "manipulation" }}
          >
            {isTouch ? "close" : "esc / close"}
          </button>
        </header>

        <div className="min-h-[7rem] sm:min-h-[9rem]">
          <p className="text-base sm:text-lg leading-relaxed text-[oklch(0.88_0.03_80)] text-pretty">
            {visibleSegments.map((seg, i) => (
              <span
                key={i}
                style={
                  seg.segment.style?.color
                    ? { color: seg.segment.style.color }
                    : undefined
                }
                className={[
                  seg.segment.style?.bold ? "font-semibold" : "",
                  seg.segment.style?.italic ? "italic" : "",
                ].join(" ")}
              >
                {seg.text}
              </span>
            ))}
            {!finished ? (
              <span
                aria-hidden
                className="inline-block w-[0.4em] h-[1em] -mb-[0.15em] ml-[0.1em] bg-[oklch(0.78_0.16_75)] animate-pulse"
              />
            ) : null}
          </p>
        </div>

        <footer className="flex flex-col gap-3">
          {showChoices ? (
            <ul className="flex flex-col gap-2">
              {showChoices.map((choice, i) => (
                <li key={`${choice.id}-${i}`}>
                  <button
                    type="button"
                    onClick={() => onChoose(choice.id)}
                    className="group w-full text-left rounded-sm border border-[oklch(0.22_0.01_70)] bg-[oklch(0.15_0.01_70)] px-4 py-3 transition-colors hover:border-[oklch(0.78_0.16_75)] hover:bg-[oklch(0.17_0.01_70)] focus-visible:border-[oklch(0.78_0.16_75)] outline-none"
                    style={{ touchAction: "manipulation" }}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.50_0.02_70)] group-hover:text-[oklch(0.78_0.16_75)] transition-colors">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="block mt-1 text-sm text-[oklch(0.88_0.03_80)]">
                      {choice.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(0.35_0.01_70)]">
                {finished
                  ? isTouch
                    ? "tap to continue"
                    : "press space to continue"
                  : "tap to skip typing"}
              </p>
              <button
                type="button"
                onClick={advanceOrClose}
                className="rounded-sm border border-[oklch(0.78_0.16_75)] bg-[oklch(0.78_0.16_75)]/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[oklch(0.78_0.16_75)] hover:bg-[oklch(0.78_0.16_75)]/20 transition-colors"
                style={{ touchAction: "manipulation" }}
              >
                {finished ? "continue" : "skip"}
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

interface VisibleSegment {
  segment: ExportedDialogueSegment;
  text: string;
}

/**
 * Given a flat reveal-count (across all segments), produce the
 * per-segment slice list we render. Keeps style boundaries intact
 * even mid-typewriter.
 */
function sliceSegments(
  segments: ExportedDialogueSegment[],
  revealed: number,
): VisibleSegment[] {
  const out: VisibleSegment[] = [];
  let remaining = revealed;
  for (const seg of segments) {
    if (remaining <= 0) break;
    const take = Math.min(seg.text.length, remaining);
    out.push({ segment: seg, text: seg.text.slice(0, take) });
    remaining -= take;
  }
  return out;
}
