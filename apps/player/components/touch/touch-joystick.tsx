"use client";

/**
 * Pointer-driven virtual joystick.
 *
 *   - The base is a fixed 144px circle at the bottom-left.
 *   - Pressing anywhere inside (or near) the base captures the pointer
 *     and the thumb tracks the touch within a clamped radius.
 *   - Releases zero the axis values so the player stops cleanly.
 *
 * The joystick *only* writes to the touch input store; the actual
 * movement math lives in `TouchMovementHandler` so the Canvas doesn't
 * re-render while the user steers.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTouchInputStore } from "@/lib/input/touch-input-store";

interface TouchJoystickProps {
  /** Size of the outer base in CSS pixels. */
  size?: number;
  /** Dead zone radius (0..1) — values inside this become 0. */
  deadZone?: number;
}

export function TouchJoystick({
  size = 144,
  deadZone = 0.12,
}: TouchJoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0 });
  const setAxis = useTouchInputStore((s) => s.setAxis);
  const setActive = useTouchInputStore((s) => s.setActive);

  const radius = size / 2;
  // Thumb travel is capped slightly inside the base so it doesn't
  // visually escape the ring on hard pulls.
  const thumbTravel = radius * 0.7;

  const updateAxis = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      // Normalize to [-1, 1] using thumbTravel as the saturation point.
      const nx = dist === 0 ? 0 : (dx / dist) * Math.min(dist / thumbTravel, 1);
      const ny = dist === 0 ? 0 : (dy / dist) * Math.min(dist / thumbTravel, 1);

      // Visual thumb stays within the base.
      const visualMag = Math.min(dist, thumbTravel);
      const visualX = dist === 0 ? 0 : (dx / dist) * visualMag;
      const visualY = dist === 0 ? 0 : (dy / dist) * visualMag;
      setThumbOffset({ x: visualX, y: visualY });

      const mag = Math.hypot(nx, ny);
      if (mag < deadZone) {
        setAxis({ forward: 0, rotate: 0 });
        return;
      }
      // Up = forward (negative screen-y), down = backward.
      // Right = turn right (positive rotate), left = turn left.
      setAxis({ forward: -ny, rotate: nx });
    },
    [deadZone, setAxis, thumbTravel],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Capture only the first pointer; ignore additional fingers.
      if (pointerIdRef.current !== null) return;
      pointerIdRef.current = e.pointerId;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* setPointerCapture can throw on stale pointers; safe to ignore */
      }
      setActive(true);
      updateAxis(e.clientX, e.clientY);
    },
    [setActive, updateAxis],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerId !== pointerIdRef.current) return;
      updateAxis(e.clientX, e.clientY);
    },
    [updateAxis],
  );

  const release = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerId !== pointerIdRef.current) return;
      pointerIdRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* releasePointerCapture can throw if already released */
      }
      setThumbOffset({ x: 0, y: 0 });
      setAxis({ forward: 0, rotate: 0 });
      setActive(false);
    },
    [setActive, setAxis],
  );

  // Defensive: if the joystick unmounts mid-press, clear the axis so
  // the player doesn't keep walking forever.
  useEffect(() => {
    return () => {
      setAxis({ forward: 0, rotate: 0 });
      setActive(false);
    };
  }, [setActive, setAxis]);

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Movement joystick"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      className="relative select-none rounded-full border"
      style={{
        width: size,
        height: size,
        background: "rgba(12, 10, 9, 0.55)",
        borderColor: "rgba(245, 158, 11, 0.35)",
        backdropFilter: "blur(6px)",
        touchAction: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Cardinal hint marks so the user understands axis mapping. */}
      <CardinalHints />
      <div
        aria-hidden
        className="absolute rounded-full"
        style={{
          width: size * 0.42,
          height: size * 0.42,
          left: "50%",
          top: "50%",
          transform: `translate(calc(-50% + ${thumbOffset.x}px), calc(-50% + ${thumbOffset.y}px))`,
          background: "rgba(245, 158, 11, 0.85)",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.4), 0 4px 16px rgba(245, 158, 11, 0.3)",
          transition:
            pointerIdRef.current === null
              ? "transform 120ms ease-out"
              : "none",
        }}
      />
    </div>
  );
}

function CardinalHints() {
  // Small triangle nubs at N/S/E/W of the base. Pure decoration.
  const tip = "rgba(245, 158, 11, 0.45)";
  return (
    <>
      <span
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: 8, color: tip, fontSize: 10, lineHeight: 1 }}
      >
        ▲
      </span>
      <span
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: 8, color: tip, fontSize: 10, lineHeight: 1 }}
      >
        ▼
      </span>
      <span
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2"
        style={{ left: 8, color: tip, fontSize: 10, lineHeight: 1 }}
      >
        ◀
      </span>
      <span
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2"
        style={{ right: 8, color: tip, fontSize: 10, lineHeight: 1 }}
      >
        ▶
      </span>
    </>
  );
}
