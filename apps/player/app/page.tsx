"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { ControlsHint } from "@/components/hud/controls-hint";
import { ScrollHint } from "@/components/hud/scroll-hint";

const PlayerView = dynamic(() => import("@/components/player-scene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-[#1a1a2e]">
      <div className="text-foreground/70 text-lg animate-pulse">
        Loading 3D World...
      </div>
    </div>
  ),
});

const PlayerCliDrawer = dynamic(
  () => import("@/components/player-cli-drawer"),
  { ssr: false }
);

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const scrollTop = window.scrollY;
      const scrollHeight = containerRef.current.scrollHeight - window.innerHeight;
      const progress = Math.min(1, Math.max(0, scrollTop / scrollHeight));

      if (isFirstPerson && progress < 0.9) {
        window.dispatchEvent(new CustomEvent("exitFirstPerson"));
      }

      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFirstPerson]);

  const handleFirstPersonChange = useCallback((active: boolean) => {
    setIsFirstPerson(active);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFirstPerson) {
        window.dispatchEvent(new CustomEvent("exitFirstPerson"));
        if (containerRef.current) {
          const scrollHeight = containerRef.current.scrollHeight - window.innerHeight;
          window.scrollTo({ top: scrollHeight * 0.7, behavior: "smooth" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFirstPerson]);

  return (
    <div ref={containerRef} className="relative">
      {/* Scrollable content — 300vh for smooth camera transitions */}
      <div className="h-[300vh]" />

      {/* Fixed 3D scene */}
      <div className="fixed inset-0">
        <PlayerView
          scrollProgress={scrollProgress}
          onFirstPersonChange={handleFirstPersonChange}
        />
      </div>

      {/* HUD overlays */}
      <ScrollHint visible={scrollProgress <= 0.05 && !isFirstPerson} />
      <ControlsHint visible={isFirstPerson} />

      {/* Player CLI drawer */}
      <PlayerCliDrawer />
    </div>
  );
}
