"use client";

/**
 * Mobile control surface, only mounted while the player is in FPS
 * exploration mode on a touch device.
 *
 *   - Bottom-left: virtual joystick (forward/back + rotate).
 *   - Anywhere else on the canvas: drag to look, tap to walk. The
 *     drag-to-look logic is a window-level listener (see
 *     `useTouchLook`) so it doesn't sit on top of the canvas and
 *     swallow R3F's pointer events; pure taps still fire R3F's
 *     `onClick` and route through the existing click-to-walk path.
 *   - Top-right: an explicit "exit" button — there's no Escape key
 *     on a phone, so the player needs an obvious way out of FPS.
 *
 * The dialogue overlay handles its own touch interactions (tap to
 * skip, tap a choice button) so this component hides itself when a
 * dialogue is active to avoid stealing the user's pointer.
 */

import { useEffect, useState } from "react";
import { useNarrativeStore } from "@/lib/narrative/narrative-store";
import { useTouchLook } from "@/lib/input/use-touch-look";
import { TouchJoystick } from "./touch-joystick";

interface TouchControlsProps {
  active: boolean;
  onExit: () => void;
}

export function TouchControls({ active, onExit }: TouchControlsProps) {
  const dialogueActive = useNarrativeStore((s) => s.active !== null);
  const enabled = active && !dialogueActive;

  // Drag-to-look. The hook attaches window listeners while enabled
  // and tears them down on disable.
  useTouchLook({ active: enabled });

  // Show the on-screen "joystick · drag to look · tap to walk" hint
  // briefly on each fresh entry into FPS, then fade it. Power users
  // shouldn't have to look at it forever.
  const [hintVisible, setHintVisible] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    setHintVisible(true);
    const t = setTimeout(() => setHintVisible(false), 4500);
    return () => clearTimeout(t);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {/* Joystick — left bottom, sits in the safe area on notched phones. */}
      <div
        data-touch-priority
        className="pointer-events-auto absolute left-6"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
        }}
      >
        <TouchJoystick />
      </div>

      {/* Exit FPS button — top-right. */}
      <div
        data-touch-priority
        className="pointer-events-auto absolute right-4"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 16px)",
        }}
      >
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit first-person view"
          className="rounded-sm border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{
            background: "rgba(12, 10, 9, 0.7)",
            borderColor: "rgba(245, 158, 11, 0.5)",
            color: "rgba(245, 158, 11, 0.95)",
            backdropFilter: "blur(6px)",
            touchAction: "manipulation",
          }}
        >
          exit
        </button>
      </div>

      {/* Hint strip — small, top-center, fades out after a few seconds. */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 transition-opacity duration-700"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 16px)",
          opacity: hintVisible ? 1 : 0,
        }}
      >
        <div
          className="rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{
            background: "rgba(12, 10, 9, 0.6)",
            borderColor: "rgba(245, 158, 11, 0.3)",
            color: "rgba(228, 228, 231, 0.75)",
            backdropFilter: "blur(6px)",
          }}
        >
          joystick · drag to look · tap to walk
        </div>
      </div>
    </div>
  );
}
