"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@dnd-agent/ui/components/drawer";
import { PlayerTerminalShell } from "@dnd-agent/player-terminal";
import { useTouchDevice } from "@/lib/input/use-touch-device";

export default function PlayerCliDrawer() {
  const [open, setOpen] = useState(false);
  const isTouch = useTouchDevice();

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        // Exit first-person mode so pointer lock is released and user can type
        window.dispatchEvent(new CustomEvent("exitFirstPerson"));
      }
      setOpen(nextOpen);
    },
    []
  );

  // Toggle with backtick key (only when terminal is not focused)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "`") {
        const active = document.activeElement;
        const isTerminalFocused =
          active?.tagName === "TEXTAREA" ||
          active?.closest(".xterm");

        if (!isTerminalFocused) {
          e.preventDefault();
          handleOpenChange(!open);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleOpenChange]);

  // Re-fit xterm after drawer finishes opening
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 350);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <button
          className="fixed right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-700/90 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-cyan-600 hover:scale-105 active:scale-95 sm:right-6 sm:h-14 sm:w-14"
          style={{
            // Keep clear of the bottom-edge joystick on mobile by
            // anchoring to the top-right when there's a touch UI
            // already at the bottom; otherwise stay bottom-right as
            // the desktop affordance.
            top: isTouch ? "calc(env(safe-area-inset-top, 0px) + 64px)" : undefined,
            bottom: isTouch ? undefined : "1.5rem",
            touchAction: "manipulation",
          }}
          aria-label="Open Player Companion"
        >
          {/* Terminal/chat icon */}
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
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" x2="20" y1="19" y2="19" />
          </svg>
        </button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[50vh] bg-[#1a1a2e] border-cyan-900/50">
        <DrawerHeader className="py-2 px-4">
          <DrawerTitle className="text-sm text-cyan-400/80 font-mono">
            Player Companion
            {!isTouch && (
              <span className="ml-2 text-xs text-cyan-700">
                press{" "}
                <kbd className="rounded border border-cyan-800 px-1 py-0.5 text-[10px]">
                  `
                </kbd>{" "}
                to toggle
              </span>
            )}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 min-h-0 px-1 pb-2">
          <PlayerTerminalShell />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
