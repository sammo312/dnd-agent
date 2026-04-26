"use client";

/**
 * Heads-up display for the FPS exploration view.
 *
 *   - A subtle center reticle so the player knows where the camera is
 *     looking. Drops away when a dialogue is active so it doesn't
 *     fight the overlay UI.
 *   - An "Approaching: …" panel pinned to the bottom that appears as
 *     the player walks within ~2x the trigger radius of a non-played
 *     beat. The progress bar fills as they close the gap, so it's
 *     completely unambiguous *which* thing is about to fire dialogue.
 *
 * Both pieces are pure HTML — no R3F — so they live outside the
 * Canvas and can read store state directly.
 */

import { useNarrativeStore } from "@/lib/narrative/narrative-store";

interface PlayerHudProps {
  /** Only show HUD chrome once the player is actually walking. */
  active: boolean;
  /** Touch device — moves the approach indicator above the joystick. */
  isTouch?: boolean;
}

export function PlayerHud({ active, isTouch = false }: PlayerHudProps) {
  const proximity = useNarrativeStore((s) => s.proximity);
  const dialogueActive = useNarrativeStore((s) => s.active !== null);

  if (!active || dialogueActive) return null;

  return (
    <>
      <Crosshair />
      <ApproachIndicator proximity={proximity} isTouch={isTouch} />
    </>
  );
}

function Crosshair() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
    >
      <div
        className="rounded-full"
        style={{
          width: 6,
          height: 6,
          background: "rgba(245, 158, 11, 0.9)",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.6), 0 0 8px rgba(245, 158, 11, 0.4)",
        }}
      />
    </div>
  );
}

interface ApproachIndicatorProps {
  proximity: ReturnType<typeof useNarrativeStore.getState>["proximity"];
  /** Lifts the indicator out of the joystick's footprint on phones. */
  isTouch: boolean;
}

function ApproachIndicator({ proximity, isTouch }: ApproachIndicatorProps) {
  if (!proximity.beatId || !Number.isFinite(proximity.distance)) return null;

  // Only show once we're meaningfully close. 2.5x the radius gives a
  // few seconds of warning at jog speed without cluttering the screen
  // when the player is on the far side of the map.
  const showRange = proximity.radius * 2.5;
  if (proximity.distance > showRange) return null;

  // Progress = 1 when the player is on the exact trigger ring, 0 at
  // the outer edge of the show range. Capped to (0, 1).
  const span = Math.max(0.01, showRange - proximity.radius);
  const raw = (showRange - proximity.distance) / span;
  const progress = Math.max(0, Math.min(1, raw));

  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none fixed inset-x-0 z-30 flex justify-center",
        // Bottom on desktop, top on touch (joystick + exit button
        // both live near the bottom edge on mobile).
        isTouch ? "top-16" : "bottom-10",
      ].join(" ")}
    >
      <div
        className="flex flex-col items-center gap-2 border px-4 py-3 shadow-2xl sm:px-5"
        style={{
          minWidth: 280,
          maxWidth: "90vw",
          background: "rgba(12, 10, 9, 0.85)",
          backdropFilter: "blur(8px)",
          borderColor: "rgba(245, 158, 11, 0.4)",
          fontFamily:
            'var(--font-mono, ui-monospace, "JetBrains Mono", monospace)',
        }}
      >
        <div className="flex items-baseline gap-3">
          <span
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ color: "rgba(245, 158, 11, 0.85)" }}
          >
            Approaching
          </span>
          <span
            className="text-sm tracking-wide"
            style={{ color: "#fafaf9" }}
          >
            {proximity.beatName}
          </span>
        </div>

        {/* Progress rail. Fills to "trigger" as the player closes. */}
        <div
          className="relative h-[3px] w-full overflow-hidden"
          style={{ background: "rgba(82, 82, 91, 0.4)" }}
        >
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${progress * 100}%`,
              background:
                progress >= 0.999
                  ? "#fafaf9"
                  : "rgba(245, 158, 11, 0.95)",
              transition: "width 80ms linear",
            }}
          />
        </div>

        <div
          className="text-[10px] tracking-wider"
          style={{ color: "rgba(228, 228, 231, 0.65)" }}
        >
          {progress >= 0.999
            ? "// step inside the ring to begin"
            : `// ${(proximity.distance - proximity.radius).toFixed(1)} tiles to trigger`}
        </div>
      </div>
    </div>
  );
}
