"use client";

/**
 * Touch input state shared between the DOM controls overlay and the
 * R3F movement handler.
 *
 * Why a store and not props: the joystick UI lives in normal DOM
 * (outside the Canvas) and the movement handler lives inside the
 * Canvas. Threading a callback prop through both worlds means
 * re-rendering the Canvas every frame the joystick moves, which is
 * unacceptable. The store lets the joystick mutate values, the
 * movement handler reads them in `useFrame`, and React doesn't need
 * to re-render either side.
 */

import { create } from "zustand";

export interface TouchAxis {
  /** Forward axis in [-1, 1]. +1 = walk forward, -1 = walk backward. */
  forward: number;
  /** Rotation axis in [-1, 1]. +1 = turn right, -1 = turn left. */
  rotate: number;
}

interface TouchInputState {
  /** True when at least one touch surface (joystick or look-drag) is engaged. */
  active: boolean;
  axis: TouchAxis;
  /** Accumulated look-drag delta (radians). Consumed by the movement handler each frame. */
  lookDelta: number;

  setAxis: (axis: TouchAxis) => void;
  setActive: (active: boolean) => void;
  /** Add a one-shot look delta (e.g. from a swipe). */
  addLookDelta: (deltaRadians: number) => void;
  /** Read current look delta, then zero it. Returns previous value. */
  consumeLookDelta: () => number;
  reset: () => void;
}

const ZERO_AXIS: TouchAxis = { forward: 0, rotate: 0 };

export const useTouchInputStore = create<TouchInputState>((set, get) => ({
  active: false,
  axis: ZERO_AXIS,
  lookDelta: 0,

  setAxis: (axis) => {
    // Cheap shallow check so identical axis values don't churn the store.
    const prev = get().axis;
    if (prev.forward === axis.forward && prev.rotate === axis.rotate) return;
    set({ axis });
  },

  setActive: (active) => {
    if (get().active === active) return;
    set({ active });
  },

  addLookDelta: (deltaRadians) => {
    if (deltaRadians === 0) return;
    set({ lookDelta: get().lookDelta + deltaRadians });
  },

  consumeLookDelta: () => {
    const v = get().lookDelta;
    if (v !== 0) set({ lookDelta: 0 });
    return v;
  },

  reset: () => set({ active: false, axis: ZERO_AXIS, lookDelta: 0 }),
}));
