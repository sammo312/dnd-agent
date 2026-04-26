"use client";

/**
 * Full-viewport import screen for `project.dnd.json`.
 *
 * Shown by the player home page whenever no project has been loaded
 * into `useProjectStore`. The DM's flow is:
 *   1. Hit "Export" in the workbench → file lands in their downloads.
 *   2. Open the player → land here.
 *   3. Drag the file onto this screen (or click to browse).
 *   4. We validate it; on success the home page swaps to the scene.
 *
 * Validation errors are surfaced inline so a malformed export tells
 * the DM exactly what to fix instead of silently failing.
 */

import { useCallback, useRef, useState } from "react";
import { useProjectStore } from "@/lib/project/project-store";

export function ProjectImportScreen() {
  const loadFromFile = useProjectStore((s) => s.loadFromFile);
  const errors = useProjectStore((s) => s.errors);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (busy) return;
      setBusy(true);
      try {
        await loadFromFile(file);
      } finally {
        setBusy(false);
      }
    },
    [busy, loadFromFile],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const onPick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) handleFile(file);
      // Reset so picking the same file again still fires onChange.
      event.target.value = "";
    },
    [handleFile],
  );

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[oklch(0.11_0.01_70)] text-[oklch(0.88_0.03_80)] p-6">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="font-mono text-xs text-[oklch(0.50_0.02_70)]">
            the living stage / player
          </p>
          <h1 className="font-mono text-2xl font-bold leading-tight">
            Drop a project to begin
          </h1>
          <p className="text-sm leading-relaxed text-[oklch(0.50_0.02_70)]">
            Export a session from the workbench (the{" "}
            <span className="font-mono text-[oklch(0.78_0.16_75)]">Export</span>{" "}
            button, top-right) and drag the resulting{" "}
            <span className="font-mono text-[oklch(0.88_0.03_80)]">
              project.dnd.json
            </span>{" "}
            file onto the area below.
          </p>
        </header>

        <div
          role="button"
          tabIndex={0}
          aria-label="Drop project.dnd.json here, or click to browse"
          onClick={onPick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPick();
            }
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={[
            "relative flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-16 text-center transition-colors cursor-pointer outline-none",
            "border-[oklch(0.22_0.01_70)] bg-[oklch(0.15_0.01_70)] hover:border-[oklch(0.78_0.16_75)] focus-visible:border-[oklch(0.78_0.16_75)]",
            dragOver
              ? "border-[oklch(0.78_0.16_75)] bg-[oklch(0.19_0.01_70)]"
              : "",
            busy ? "opacity-60 cursor-progress" : "",
          ].join(" ")}
        >
          <DropIcon />
          <p className="font-mono text-sm text-[oklch(0.88_0.03_80)]">
            {busy
              ? "reading file..."
              : dragOver
                ? "release to load"
                : "drop project.dnd.json"}
          </p>
          <p className="text-xs text-[oklch(0.50_0.02_70)]">
            or click to browse
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            onChange={onFileChange}
            className="sr-only"
          />
        </div>

        {errors.length > 0 ? (
          <section
            role="alert"
            aria-live="polite"
            className="rounded-sm border border-[oklch(0.52_0.19_25)]/40 bg-[oklch(0.52_0.19_25)]/10 p-4"
          >
            <p className="font-mono text-xs text-[oklch(0.52_0.19_25)] mb-2">
              {errors.length === 1
                ? "1 problem with that file"
                : `${errors.length} problems with that file`}
            </p>
            <ul className="space-y-1 text-xs text-[oklch(0.88_0.03_80)] font-mono leading-relaxed">
              {errors.slice(0, 8).map((err, i) => (
                <li key={i} className="break-words">
                  · {err}
                </li>
              ))}
              {errors.length > 8 ? (
                <li className="text-[oklch(0.50_0.02_70)]">
                  · …and {errors.length - 8} more
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}

        <footer className="text-xs text-[oklch(0.35_0.01_70)] font-mono leading-relaxed">
          tip: nothing leaves your machine — the file is parsed entirely
          in-browser.
        </footer>
      </div>
    </main>
  );
}

function DropIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8 text-[oklch(0.78_0.16_75)]"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 18v-6" />
      <path d="m9 15 3 3 3-3" />
    </svg>
  );
}
