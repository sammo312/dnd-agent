"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { ControlsHint } from "@/components/hud/controls-hint";
import { ScrollHint } from "@/components/hud/scroll-hint";
import { ProjectImportScreen } from "@/components/project-import-screen";
import { ProjectLoadedSummary } from "@/components/project-loaded-summary";
import { useProjectStore } from "@/lib/project/project-store";

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

// Three high-level UI states the player can be in. The home page is a
// router between them, driven by `useProjectStore` + a local "have we
// dismissed the post-load summary?" flag.
type Stage = "import" | "summary" | "scene";

export default function Home() {
  const project = useProjectStore((s) => s.project);
  const loadedAt = useProjectStore((s) => s.loadedAt);
  const hydrateFromSession = useProjectStore((s) => s.hydrateFromSession);

  // Restore previously-loaded project on first mount so a refresh
  // during an iteration loop doesn't kick the DM back to the import
  // screen.
  useEffect(() => {
    hydrateFromSession();
  }, [hydrateFromSession]);

  const [enteredScene, setEnteredScene] = useState(false);

  // Any fresh import (loadedAt change) bounces us back to the summary,
  // so the DM gets a confirmation read-back of what just landed.
  useEffect(() => {
    setEnteredScene(false);
  }, [loadedAt]);

  const stage: Stage = !project
    ? "import"
    : enteredScene
      ? "scene"
      : "summary";

  if (stage === "import") {
    return <ProjectImportScreen />;
  }

  if (stage === "summary") {
    return <ProjectLoadedSummary onEnter={() => setEnteredScene(true)} />;
  }

  return <SceneStage />;
}

/**
 * 3D scroll-driven scene rendering the imported project. We pull the
 * project out of the store here (rather than threading it through
 * props) so the dynamic import boundary in `PlayerView` stays simple.
 */
function SceneStage() {
  const project = useProjectStore((s) => s.project);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const scrollTop = window.scrollY;
      const scrollHeight =
        containerRef.current.scrollHeight - window.innerHeight;
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
          const scrollHeight =
            containerRef.current.scrollHeight - window.innerHeight;
          window.scrollTo({ top: scrollHeight * 0.7, behavior: "smooth" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFirstPerson]);

  // The import gate above guarantees a project is loaded before we
  // mount this stage, but TypeScript can't see that across the store
  // boundary — bail defensively.
  if (!project) return null;

  return (
    <div ref={containerRef} className="relative">
      {/* Scrollable content — 300vh for smooth camera transitions */}
      <div className="h-[300vh]" />

      {/* Fixed 3D scene */}
      <div className="fixed inset-0">
        <PlayerView
          project={project}
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
