"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@dnd-agent/ui/components/button";
import { Play, Square, RotateCcw } from "lucide-react";
import type { DialogueSegment } from "../../lib/story-types";
import { cn } from "@dnd-agent/ui/lib/utils";

interface DialoguePreviewProps {
  dialogue: DialogueSegment[];
  speaker?: string;
}

// Speed convention colors (matching the editor)
const SPEED_CONVENTIONS = [
  { min: 0, max: 40, color: "bg-emerald-500/40" },
  { min: 41, max: 80, color: "bg-slate-500/40" },
  { min: 81, max: 150, color: "bg-amber-500/40" },
  { min: 151, max: 250, color: "bg-orange-500/40" },
  { min: 251, max: Infinity, color: "bg-red-500/40" },
];

function getSpeedColor(speed: number) {
  return SPEED_CONVENTIONS.find((c) => speed >= c.min && speed <= c.max)?.color || "bg-slate-500/40";
}

export function DialoguePreview({ dialogue, speaker }: DialoguePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(100); // Default to end (show all)
  const [currentTime, setCurrentTime] = useState(0); // Will be set to totalDuration
  const [hasInteracted, setHasInteracted] = useState(false); // Track if user has interacted
  const timelineRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<{ startTime: number; startMs: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  // Calculate total duration and segment positions
  const { totalDuration, segmentPositions } = useMemo(() => {
    let total = 0;
    const positions: { start: number; end: number; duration: number }[] = [];

    dialogue.forEach((seg) => {
      const duration = seg.text.length * seg.speed;
      positions.push({ start: total, end: total + duration, duration });
      total += duration;
    });

    return { totalDuration: total || 1, segmentPositions: positions };
  }, [dialogue]);

  // When dialogue changes and user hasn't interacted, keep showing full text
  // When dialogue changes and playhead is at end, update currentTime to match new duration
  useEffect(() => {
    if (!hasInteracted || playheadPosition >= 99) {
      setCurrentTime(totalDuration);
      setPlayheadPosition(100);
    }
  }, [totalDuration, hasInteracted, playheadPosition]);

  // Playback loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const tick = () => {
      if (!playbackRef.current) return;

      const elapsed = Date.now() - playbackRef.current.startTime;
      const newTime = playbackRef.current.startMs + elapsed;

      if (newTime >= totalDuration) {
        setCurrentTime(totalDuration);
        setPlayheadPosition(100);
        setIsPlaying(false);
        playbackRef.current = null;
        return;
      }

      setCurrentTime(newTime);
      setPlayheadPosition((newTime / totalDuration) * 100);
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, totalDuration]);

  const handlePlay = useCallback(() => {
    setHasInteracted(true);
    // Start from current position, or from beginning if at end
    const startMs = currentTime >= totalDuration ? 0 : currentTime;

    if (startMs === 0) {
      setCurrentTime(0);
      setPlayheadPosition(0);
    }

    playbackRef.current = {
      startTime: Date.now(),
      startMs: startMs,
    };
    setIsPlaying(true);
  }, [currentTime, totalDuration]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    playbackRef.current = null;
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    playbackRef.current = null;
    setCurrentTime(0);
    setPlayheadPosition(0);
  }, []);

  // Seek to position
  const seekToPercent = useCallback((percent: number) => {
    setHasInteracted(true);
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const newTime = (clampedPercent / 100) * totalDuration;
    setPlayheadPosition(clampedPercent);
    setCurrentTime(newTime);
  }, [totalDuration]);

  // Click on timeline to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying) return;

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const percent = (clickX / rect.width) * 100;
    seekToPercent(percent);
  }, [isPlaying, seekToPercent]);

  // Drag playhead
  const handlePlayheadDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const updatePosition = (clientX: number) => {
      const x = clientX - rect.left;
      const percent = (x / rect.width) * 100;
      seekToPercent(percent);
    };

    const handleMouseMove = (ev: MouseEvent) => {
      updatePosition(ev.clientX);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [isPlaying, seekToPercent]);

  if (dialogue.length === 0) {
    return null;
  }

  const hasText = dialogue.some(seg => seg.text.length > 0);

  // Calculate what text to show based on current time
  const getTextAtTime = () => {
    const result: { segment: DialogueSegment; text: string }[] = [];

    // If at start (0%) or end (100%), show all text
    if (playheadPosition <= 0.1 || playheadPosition >= 99.9 || currentTime >= totalDuration) {
      return dialogue.map(seg => ({ segment: seg, text: seg.text }));
    }

    for (let i = 0; i < dialogue.length; i++) {
      const pos = segmentPositions[i];

      if (currentTime >= pos.end) {
        // Full segment visible
        result.push({ segment: dialogue[i], text: dialogue[i].text });
      } else if (currentTime >= pos.start) {
        // Partial segment
        const elapsedInSegment = currentTime - pos.start;
        const chars = Math.floor(elapsedInSegment / dialogue[i].speed);
        result.push({ segment: dialogue[i], text: dialogue[i].text.slice(0, chars) });
        break;
      } else {
        break;
      }
    }

    return result;
  };

  const visibleText = getTextAtTime();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">
          Preview
        </span>
        <div className="flex gap-0.5">
          {!isPlaying ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlay}
              className="h-5 px-1.5 text-[9px] gap-0.5"
              disabled={!hasText}
            >
              <Play className="w-2.5 h-2.5" />
              Play
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStop}
              className="h-5 px-1.5 text-[9px] gap-0.5"
            >
              <Square className="w-2.5 h-2.5" />
              Stop
            </Button>
          )}
          {(isPlaying || playheadPosition > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-5 px-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </Button>
          )}
        </div>
        <span className="text-[8px] text-muted-foreground/60 ml-auto font-mono tabular-nums">
          {Math.round(currentTime)}ms / {totalDuration}ms
        </span>
      </div>

      {/* Timeline / Playhead */}
      <div
        ref={timelineRef}
        className={cn(
          "relative h-4 bg-black/20 rounded overflow-hidden cursor-pointer",
          isPlaying && "cursor-default"
        )}
        onClick={handleTimelineClick}
      >
        {/* Segment bars */}
        <div className="absolute inset-0 flex">
          {dialogue.map((seg, i) => {
            const width = (segmentPositions[i].duration / totalDuration) * 100;
            return (
              <div
                key={i}
                className={cn(
                  "h-full border-r border-black/20 last:border-r-0",
                  getSpeedColor(seg.speed)
                )}
                style={{ width: `${width}%` }}
                title={`${seg.text.slice(0, 20)}${seg.text.length > 20 ? '...' : ''} (${seg.speed}ms)`}
              />
            );
          })}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-sm cursor-ew-resize z-10"
          style={{ left: `${playheadPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handlePlayheadDrag}
        >
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-1.5 bg-primary rounded-t-sm" />
        </div>
      </div>

      <div className="bg-black/20 rounded px-2 py-1.5 min-h-[40px]">
        {speaker && (
          <div className="text-[9px] font-medium text-primary/80 mb-1 uppercase tracking-wider">
            {speaker}
          </div>
        )}
        <div className="text-sm text-foreground leading-relaxed">
          {visibleText.map(({ segment, text }, index) => (
            <span key={index} style={{ color: segment.style?.color || "inherit" }}>
              {text}
            </span>
          ))}
          {currentTime < totalDuration && (
            <span className={cn(
              "inline-block w-0.5 h-3.5 ml-px",
              isPlaying ? "bg-primary/60 animate-pulse" : "bg-primary/40"
            )} />
          )}
          {!hasText && (
            <span className="text-muted-foreground/40 text-xs italic">No text yet</span>
          )}
        </div>
      </div>
    </div>
  );
}
