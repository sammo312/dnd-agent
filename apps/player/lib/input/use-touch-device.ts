"use client";

/**
 * Detect whether the player is on a touch-primary device.
 *
 * Uses `(hover: none) and (pointer: coarse)` rather than a viewport
 * width check — that correctly catches phones / tablets while still
 * letting iPad-with-keyboard or Surface laptops keep the desktop
 * keyboard controls. Falls back to `false` on the server.
 */

import { useEffect, useState } from "react";

export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia("(hover: none) and (pointer: coarse)");
    const update = () => setIsTouch(mql.matches);
    update();

    // Older Safari uses addListener/removeListener, modern browsers use
    // add/removeEventListener.
    if ("addEventListener" in mql) {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    // @ts-expect-error legacy fallback
    mql.addListener(update);
    return () => {
      // @ts-expect-error legacy fallback
      mql.removeListener(update);
    };
  }, []);

  return isTouch;
}
