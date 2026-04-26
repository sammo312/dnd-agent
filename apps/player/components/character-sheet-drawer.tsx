"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@dnd-agent/ui/components/drawer";
import type { CharacterSheet } from "@dnd-agent/shared";
import { useTouchDevice } from "@/lib/input/use-touch-device";
import { CharacterSheetPanel } from "./character-sheet-panel";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to load sheet: ${res.status}`);
    return res.json() as Promise<CharacterSheet>;
  });

/**
 * Visual companion to the AI-driven CLI: a slide-up drawer that
 * shows the character sheet + inventory the player has been
 * building through the chat. The data lives server-side in the
 * character-builder tool's singleton; we mirror it here via a
 * small GET endpoint, polling slowly while the drawer is open so
 * inventory pickups / level-ups appear without a manual refresh.
 */
export default function CharacterSheetDrawer() {
  const [open, setOpen] = useState(false);
  const isTouch = useTouchDevice();

  // Only poll while open — there's no reason to keep hitting the
  // endpoint while the player is in the world.
  const { data, error, isLoading, mutate } = useSWR<CharacterSheet>(
    open ? "/api/character-sheet" : null,
    fetcher,
    {
      refreshInterval: open ? 2500 : 0,
      revalidateOnFocus: true,
    },
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        // Same handshake as the CLI drawer: drop pointer lock
        // before opening so the player can interact with the panel.
        window.dispatchEvent(new CustomEvent("exitFirstPerson"));
        // Immediate refresh on open so first paint isn't stale.
        mutate();
      }
      setOpen(nextOpen);
    },
    [mutate],
  );

  // Toggle with the "c" key for desktop discoverability.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "c") return;
      const active = document.activeElement;
      const typing =
        active?.tagName === "INPUT" ||
        active?.tagName === "TEXTAREA" ||
        active?.closest(".xterm");
      if (typing) return;
      e.preventDefault();
      handleOpenChange(!open);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleOpenChange]);

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <button
          // Anchored to the LEFT side so it doesn't fight the CLI
          // button (right side). On touch we top-anchor with the same
          // safe-area inset the CLI button uses, so both icons live
          // on the same horizontal band above the joystick.
          className="fixed left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-amber-700/90 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-amber-600 hover:scale-105 active:scale-95 sm:left-6 sm:h-14 sm:w-14"
          style={{
            top: isTouch ? "calc(env(safe-area-inset-top, 0px) + 64px)" : undefined,
            bottom: isTouch ? undefined : "1.5rem",
            touchAction: "manipulation",
          }}
          aria-label="Open Character Sheet"
        >
          {/* Shield-with-sword glyph: reads as "character" without
              relying on emoji. */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" />
          </svg>
        </button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[80vh] bg-[#0d1418] border-cyan-900/50">
        <DrawerHeader className="py-2 px-4">
          <DrawerTitle className="text-sm text-cyan-400/80 font-mono">
            Character &amp; Inventory
            {!isTouch && (
              <span className="ml-2 text-xs text-cyan-700">
                press{" "}
                <kbd className="rounded border border-cyan-800 px-1 py-0.5 text-[10px]">
                  c
                </kbd>{" "}
                to toggle
              </span>
            )}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 min-h-0">
          <CharacterSheetPanel
            sheet={data}
            isLoading={isLoading}
            isError={!!error}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
