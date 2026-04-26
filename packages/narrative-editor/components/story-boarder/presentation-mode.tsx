"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@dnd-agent/ui/components/button";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Volume2,
  Image as ImageIcon,
  Box,
  RotateCcw,
} from "lucide-react";
import type { DialogueNode, Section, ExportedChapter, ExportedChapterData, ExportedDialogue, DialogueSegment } from "../../lib/story-types";
import { cn } from "@dnd-agent/ui/lib/utils";

interface PresentationModeProps {
  data: ExportedChapter[];
  onClose: () => void;
  startChapterIndex?: number;
  startNodeIndex?: number;
}

export function PresentationMode({
  data,
  onClose,
  startChapterIndex = 0,
  startNodeIndex = 0,
}: PresentationModeProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(startChapterIndex);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(startNodeIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const playbackRef = useRef<{ startTime: number; startMs: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  // Flatten chapters for easier navigation
  const flattenedData = useMemo(() => {
    const result: { chapterName: string; chapter: ExportedChapterData; node: ExportedDialogue; chapterIndex: number; nodeIndex: number }[] = [];
    data.forEach((chapterObj, chapterIndex) => {
      const chapterName = Object.keys(chapterObj)[0];
      const chapter = chapterObj[chapterName];
      if (chapter?.nodes) {
        chapter.nodes.forEach((node, nodeIndex) => {
          result.push({ chapterName, chapter, node, chapterIndex, nodeIndex });
        });
      }
    });
    return result;
  }, [data]);

  // Get current chapter and node
  const currentChapterObj = data[currentChapterIndex];
  const currentChapterName = currentChapterObj ? Object.keys(currentChapterObj)[0] : "";
  const currentChapter: ExportedChapterData | null = currentChapterObj ? currentChapterObj[currentChapterName] : null;
  const currentNode: ExportedDialogue | null = currentChapter?.nodes?.[currentNodeIndex] || null;

  // Get effective values (node overrides chapter defaults)
  const effectiveBackground = currentNode?.background || currentChapter?.background;
  const effectiveMusic = currentNode?.music || currentChapter?.music;
  const effectiveGltf = currentNode?.gltf || currentChapter?.gltf;

  // Calculate total duration for current node
  const { totalDuration, segmentPositions } = useMemo(() => {
    if (!currentNode) return { totalDuration: 1, segmentPositions: [] };

    let total = 0;
    const positions: { start: number; end: number; duration: number }[] = [];

    currentNode.dialogue.forEach((seg) => {
      const duration = seg.text.length * seg.speed;
      positions.push({ start: total, end: total + duration, duration });
      total += duration;
    });

    return { totalDuration: total || 1, segmentPositions: positions };
  }, [currentNode]);

  // Playback loop
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
        setIsPlaying(false);
        playbackRef.current = null;

        // Show choices or auto-advance
        if (currentNode?.choices && currentNode.choices.length > 0) {
          setShowChoices(true);
        } else if (autoAdvance) {
          // Wait a moment then advance
          setTimeout(() => handleNext(), 1500);
        }
        return;
      }

      setCurrentTime(newTime);
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, totalDuration, currentNode, autoAdvance]);

  const handlePlay = useCallback(() => {
    const startMs = currentTime >= totalDuration ? 0 : currentTime;

    if (startMs === 0) {
      setCurrentTime(0);
      setShowChoices(false);
    }

    playbackRef.current = {
      startTime: Date.now(),
      startMs: startMs,
    };
    setIsPlaying(true);
  }, [currentTime, totalDuration]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    playbackRef.current = null;
  }, []);

  const handleNext = useCallback(() => {
    if (!currentChapter) return;

    setShowChoices(false);
    setCurrentTime(0);
    setIsPlaying(false);
    playbackRef.current = null;

    if (currentNodeIndex < currentChapter.nodes.length - 1) {
      setCurrentNodeIndex(currentNodeIndex + 1);
    } else if (currentChapterIndex < data.length - 1) {
      // Move to next chapter
      setCurrentChapterIndex(currentChapterIndex + 1);
      setCurrentNodeIndex(0);
    }
  }, [currentChapter, currentNodeIndex, currentChapterIndex, data.length]);

  const handlePrev = useCallback(() => {
    setShowChoices(false);
    setCurrentTime(0);
    setIsPlaying(false);
    playbackRef.current = null;

    if (currentNodeIndex > 0) {
      setCurrentNodeIndex(currentNodeIndex - 1);
    } else if (currentChapterIndex > 0) {
      // Move to previous chapter's last node
      const prevChapterObj = data[currentChapterIndex - 1];
      const prevChapterName = Object.keys(prevChapterObj)[0];
      const prevChapter = prevChapterObj[prevChapterName];
      setCurrentChapterIndex(currentChapterIndex - 1);
      setCurrentNodeIndex(prevChapter.nodes.length - 1);
    }
  }, [currentNodeIndex, currentChapterIndex, data]);

  const handleChoiceSelect = useCallback((choiceId: string) => {
    // Find the node with this ID
    let found = false;
    data.forEach((chapterObj, chapterIdx) => {
      const chapterName = Object.keys(chapterObj)[0];
      const chapter = chapterObj[chapterName];
      chapter.nodes.forEach((node, nodeIdx) => {
        if (node.id === choiceId && !found) {
          found = true;
          setCurrentChapterIndex(chapterIdx);
          setCurrentNodeIndex(nodeIdx);
          setShowChoices(false);
          setCurrentTime(0);
          setIsPlaying(false);
          playbackRef.current = null;
        }
      });
    });
  }, [data]);

  const handleRestart = useCallback(() => {
    setCurrentChapterIndex(0);
    setCurrentNodeIndex(0);
    setCurrentTime(0);
    setShowChoices(false);
    setIsPlaying(false);
    playbackRef.current = null;
  }, []);

  // Auto-play on node change
  useEffect(() => {
    if (autoAdvance && currentNode && !showChoices) {
      const timer = setTimeout(() => {
        handlePlay();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentChapterIndex, currentNodeIndex]);

  // Calculate visible text
  const getVisibleText = () => {
    if (!currentNode) return [];

    const result: { segment: DialogueSegment; text: string }[] = [];

    // If finished, show all
    if (currentTime >= totalDuration) {
      return currentNode.dialogue.map(seg => ({ segment: seg, text: seg.text }));
    }

    for (let i = 0; i < currentNode.dialogue.length; i++) {
      const pos = segmentPositions[i];

      if (currentTime >= pos.end) {
        result.push({ segment: currentNode.dialogue[i], text: currentNode.dialogue[i].text });
      } else if (currentTime >= pos.start) {
        const elapsedInSegment = currentTime - pos.start;
        const chars = Math.floor(elapsedInSegment / currentNode.dialogue[i].speed);
        result.push({ segment: currentNode.dialogue[i], text: currentNode.dialogue[i].text.slice(0, chars) });
        break;
      } else {
        break;
      }
    }

    return result;
  };

  const visibleText = getVisibleText();
  const progress = (currentTime / totalDuration) * 100;

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
          e.preventDefault();
          if (isPlaying) handlePause();
          else handlePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrev();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "r":
          e.preventDefault();
          handleRestart();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, handlePlay, handlePause, handleNext, handlePrev, onClose, handleRestart]);

  if (!currentNode) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">No dialogue nodes to present</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  // Calculate flat index for progress indicator
  let flatIndex = 0;
  for (let c = 0; c < currentChapterIndex; c++) {
    const chapterObj = data[c];
    const chapterName = Object.keys(chapterObj)[0];
    flatIndex += chapterObj[chapterName].nodes.length;
  }
  flatIndex += currentNodeIndex;
  const totalNodes = flattenedData.length;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Background layer */}
      {effectiveBackground && (
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="text-center text-white/50">
            <ImageIcon className="w-16 h-16 mx-auto mb-2" />
            <p className="text-sm font-mono">{effectiveBackground}</p>
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Chapter indicator */}
      <div className="absolute top-4 left-4 z-10 text-white/60 text-sm">
        <span className="font-medium text-white">{currentChapterName}</span>
        <span className="mx-2 text-white/30">|</span>
        <span className="font-mono">{currentNode.id}</span>
      </div>

      {/* Asset indicators */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3 text-white/40 text-xs">
        {effectiveMusic && (
          <div className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            <span className="font-mono">{effectiveMusic}</span>
          </div>
        )}
        {effectiveGltf && (
          <div className="flex items-center gap-1">
            <Box className="w-3.5 h-3.5" />
            <span className="font-mono">{effectiveGltf}</span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 md:px-16 lg:px-32">
        {/* Speaker */}
        <div className="mb-4">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">
            {currentNode.speaker}
          </span>
        </div>

        {/* Dialogue text */}
        <div className="max-w-3xl text-center">
          <p className="text-white text-2xl md:text-3xl lg:text-4xl leading-relaxed font-light">
            {visibleText.map(({ segment, text }, index) => (
              <span key={index} style={{ color: segment.style?.color || "inherit" }}>
                {text}
              </span>
            ))}
            {currentTime < totalDuration && (
              <span className={cn(
                "inline-block w-0.5 h-6 md:h-8 ml-1 align-middle",
                isPlaying ? "bg-white/80 animate-pulse" : "bg-white/40"
              )} />
            )}
          </p>
        </div>

        {/* Choices */}
        {showChoices && currentNode.choices && currentNode.choices.length > 0 && (
          <div className="mt-12 flex flex-col gap-3">
            {currentNode.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleChoiceSelect(choice.id)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-lg transition-all hover:scale-105"
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-24 left-8 right-8 md:left-16 md:right-16 lg:left-32 lg:right-32">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRestart}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          className="text-white/60 hover:text-white hover:bg-white/10"
          disabled={currentChapterIndex === 0 && currentNodeIndex === 0}
        >
          <SkipBack className="w-5 h-5" />
        </Button>

        {!isPlaying ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlay}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <Play className="w-6 h-6" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePause}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <Pause className="w-6 h-6" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="text-white/60 hover:text-white hover:bg-white/10"
          disabled={
            currentChapterIndex === data.length - 1 &&
            currentNodeIndex === (currentChapter?.nodes.length || 0) - 1
          }
        >
          <SkipForward className="w-5 h-5" />
        </Button>

        {/* Node counter */}
        <div className="absolute right-8 text-white/40 text-sm font-mono">
          {flatIndex + 1} / {totalNodes}
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 left-8 text-white/20 text-xs hidden md:flex gap-4">
        <span>Space: Play/Pause</span>
        <span>Arrows: Navigate</span>
        <span>R: Restart</span>
        <span>Esc: Close</span>
      </div>
    </div>
  );
}
