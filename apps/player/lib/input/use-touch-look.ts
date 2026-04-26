"use client";

/**
 * Window-level pointer listener that converts horizontal drags on
 * the world (the canvas) into rotation deltas in the touch input
 * store. Listens on window so it doesn't interfere with
 * react-three-fiber's own pointer pipeline:
 *
 *   - Pointers captured by the virtual joystick never bubble here
 *     (they're under exclusive capture), so the joystick keeps
 *     working normally.
 *   - A short, mostly-still tap on the canvas never crosses our
 *     drag threshold → R3F still sees it as a click → the existing
 *     `onClick`-based click-to-walk handler fires.
 *   - A drag does cross the threshold → we accumulate look deltas
 *     and call `preventDefault` on subsequent moves so the browser
 *     doesn't try to scroll the page or trigger a long-press menu.
 *     R3F also drops the click (movement exceeds its own threshold).
 */

import { useEffect, useRef } from "react";
import { useTouchInputStore } from "./touch-input-store";

interface UseTouchLookOpts {
  active: boolean;
  /** Pixels of movement before we lock into look-drag mode. */
  dragThresholdPx?: number;
  /** Radians of yaw applied per pixel of horizontal movement. */
  sensitivity?: number;
}

export function useTouchLook({
  active,
  dragThresholdPx = 10,
  sensitivity = 0.005,
}: UseTouchLookOpts) {
  const stateRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    lastX: number;
    dragging: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    dragging: false,
  });

  useEffect(() => {
    if (!active) return;

    const onPointerDown = (e: PointerEvent) => {
      // Single-finger only — additional fingers are typically the
      // joystick on the other side, which has its own capture.
      if (stateRef.current.pointerId !== null) return;
      // Ignore pointers that originated on interactive UI elements
      // (joystick, exit button, drawer, etc). Those carry a
      // `data-touch-priority` attribute or sit inside a capturing
      // listener, so they won't reach this window-level listener at
      // all once captured — but on `pointerdown` we may still see
      // them. A conservative check: if the target is inside a
      // `[data-touch-priority]` ancestor, bail.
      const target = e.target as Element | null;
      if (target && target.closest?.("[data-touch-priority]")) return;

      stateRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        dragging: false,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      const s = stateRef.current;
      if (s.pointerId !== e.pointerId) return;

      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;

      if (!s.dragging) {
        // Need to cross the threshold AND be primarily horizontal —
        // that way a vertical swipe (which the user might be doing
        // to scroll, even though `touch-action: none` prevents it
        // mid-FPS) doesn't accidentally trigger look.
        const movedEnough =
          Math.hypot(dx, dy) > dragThresholdPx &&
          Math.abs(dx) > Math.abs(dy);
        if (!movedEnough) return;
        s.dragging = true;
      }

      const incremental = e.clientX - s.lastX;
      s.lastX = e.clientX;
      // Drag right → camera rotates right.
      useTouchInputStore.getState().addLookDelta(incremental * sensitivity);

      // Once we're dragging, suppress browser default behavior
      // (long-press selection, etc).
      if (e.cancelable) e.preventDefault();
    };

    const onPointerUp = (e: PointerEvent) => {
      const s = stateRef.current;
      if (s.pointerId !== e.pointerId) return;
      stateRef.current = {
        pointerId: null,
        startX: 0,
        startY: 0,
        lastX: 0,
        dragging: false,
      };
    };

    // `passive: false` on pointermove so we can `preventDefault` once
    // we lock into look-drag mode.
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      stateRef.current = {
        pointerId: null,
        startX: 0,
        startY: 0,
        lastX: 0,
        dragging: false,
      };
    };
  }, [active, dragThresholdPx, sensitivity]);
}
