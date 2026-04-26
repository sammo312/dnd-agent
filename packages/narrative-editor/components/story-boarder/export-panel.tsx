"use client";

import React from "react";

import { useState, useMemo } from "react";
import { Button } from "@dnd-agent/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@dnd-agent/ui/components/dialog";
import {
  Download,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Layers,
  MessageSquare,
} from "lucide-react";
import type { ExportedChapter, ExportedChapterData, ExportedDialogue } from "../../lib/story-types";
import { cn } from "@dnd-agent/ui/lib/utils";

interface ExportPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExportedChapter[];
}

function CopyButton({
  data,
  size = "sm",
  className
}: {
  data: unknown;
  size?: "sm" | "xs";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-muted",
        size === "xs" ? "p-0.5" : "p-1",
        className
      )}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className={cn("text-green-500", size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5")} />
      ) : (
        <Copy className={cn("text-muted-foreground", size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5")} />
      )}
    </button>
  );
}

function DialogueItem({ dialogue, index }: { dialogue: ExportedDialogue; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const previewText = dialogue.dialogue.map((d) => d.text).join(" ").slice(0, 50);

  return (
    <div className="border-l-2 border-primary/30 pl-3 py-1 group/dialogue">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded px-1 -ml-1"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
        )}
        <MessageSquare className="w-3 h-3 text-primary shrink-0" />
        <span className="text-xs font-mono text-muted-foreground">{index + 1}.</span>
        <span className="text-xs font-medium truncate">{dialogue.speaker}</span>
        <span className="text-[10px] text-muted-foreground truncate flex-1">
          {previewText}{previewText.length >= 50 ? "..." : ""}
        </span>
        <CopyButton data={dialogue} size="xs" className="group-hover/dialogue:opacity-100" />
      </button>

      {expanded && (
        <div className="mt-2 ml-5 space-y-2 text-xs">
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span className="text-muted-foreground uppercase text-[10px]">ID</span>
            <span className="font-mono text-[11px]">{dialogue.id}</span>
          </div>
          {dialogue.gltf && (
            <div className="grid grid-cols-[80px_1fr] gap-1">
              <span className="text-muted-foreground uppercase text-[10px]">GLTF</span>
              <span className="font-mono text-[11px] truncate">{dialogue.gltf}</span>
            </div>
          )}
          {dialogue.background && (
            <div className="grid grid-cols-[80px_1fr] gap-1">
              <span className="text-muted-foreground uppercase text-[10px]">BG</span>
              <span className="font-mono text-[11px] truncate">{dialogue.background}</span>
            </div>
          )}
          {dialogue.music && (
            <div className="grid grid-cols-[80px_1fr] gap-1">
              <span className="text-muted-foreground uppercase text-[10px]">MUSIC</span>
              <span className="font-mono text-[11px] truncate">{dialogue.music}</span>
            </div>
          )}
          <div className="space-y-1">
            <span className="text-muted-foreground uppercase text-[10px]">DIALOGUE</span>
            <div className="flex flex-wrap gap-1">
              {dialogue.dialogue.map((seg, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-[11px]"
                  style={{ color: seg.style?.color }}
                >
                  <span className="opacity-50 text-[9px]">{seg.speed}ms</span>
                  {seg.text || <span className="opacity-30">(pause)</span>}
                </span>
              ))}
            </div>
          </div>
          {dialogue.choices && dialogue.choices.length > 0 && (
            <div className="space-y-1">
              <span className="text-muted-foreground uppercase text-[10px]">CHOICES</span>
              <div className="flex flex-wrap gap-1">
                {dialogue.choices.map((choice, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/20 text-[11px]"
                  >
                    {choice.label}
                    <span className="opacity-50 font-mono">-&gt; {choice.id}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChapterItem({ chapterObj }: { chapterObj: ExportedChapter }) {
  const [expanded, setExpanded] = useState(true);

  // Extract chapter name and data from key-value format
  const chapterName = Object.keys(chapterObj)[0];
  const chapter: ExportedChapterData = chapterObj[chapterName];

  return (
    <div className="space-y-1 group/section">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded px-2 py-1 -ml-2"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <Layers className="w-4 h-4 text-node-scene" />
        <span className="font-medium">{chapterName}</span>
        <span className="text-xs text-muted-foreground ml-auto mr-2">
          {chapter.nodes.length} node{chapter.nodes.length !== 1 ? "s" : ""}
        </span>
        <CopyButton data={chapterObj} className="group-hover/section:opacity-100" />
      </button>

      {expanded && (
        <div className="ml-6 space-y-1">
          {/* Chapter metadata */}
          {(chapter.background || chapter.music || chapter.gltf) && (
            <div className="flex flex-wrap gap-2 py-1 px-2 bg-muted/30 rounded text-[10px] mb-2">
              {chapter.background && (
                <span className="text-muted-foreground">
                  <span className="uppercase">BG:</span> <span className="font-mono">{chapter.background}</span>
                </span>
              )}
              {chapter.music && (
                <span className="text-muted-foreground">
                  <span className="uppercase">Music:</span> <span className="font-mono">{chapter.music}</span>
                </span>
              )}
              {chapter.gltf && (
                <span className="text-muted-foreground">
                  <span className="uppercase">GLTF:</span> <span className="font-mono">{chapter.gltf}</span>
                </span>
              )}
            </div>
          )}
          {chapter.nodes.map((dialogue, i) => (
            <DialogueItem key={dialogue.id} dialogue={dialogue} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ExportPanel({ open, onOpenChange, data }: ExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"tree" | "json">("tree");

  const jsonString = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const stats = useMemo(() => {
    let chapters = 0;
    let dialogues = 0;
    let choices = 0;

    for (const chapterObj of data) {
      chapters++;
      const chapterName = Object.keys(chapterObj)[0];
      const chapter = chapterObj[chapterName];
      dialogues += chapter.nodes.length;
      for (const d of chapter.nodes) {
        choices += d.choices?.length || 0;
      }
    }

    return { chapters, dialogues, choices };
  }, [data]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "story-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-4">
            Export Story
            <div className="flex items-center gap-3 text-xs font-normal text-muted-foreground ml-auto mr-8">
              <span>{stats.chapters} chapter{stats.chapters !== 1 ? "s" : ""}</span>
              <span>{stats.dialogues} node{stats.dialogues !== 1 ? "s" : ""}</span>
              <span>{stats.choices} choice{stats.choices !== 1 ? "s" : ""}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* View Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/30">
            <button
              onClick={() => setView("tree")}
              className={cn(
                "px-3 py-1 text-xs rounded transition-colors",
                view === "tree" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tree View
            </button>
            <button
              onClick={() => setView("json")}
              className={cn(
                "px-3 py-1 text-xs rounded transition-colors",
                view === "json" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Raw JSON
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 border border-border rounded-md bg-muted/20 overflow-hidden">
          {view === "tree" ? (
            <div className="h-full overflow-y-auto p-4 space-y-3">
              {data.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No data to export. Add chapters and dialogues first.
                </p>
              ) : (
                data.map((chapterObj, i) => (
                  <ChapterItem key={Object.keys(chapterObj)[0] || i} chapterObj={chapterObj} />
                ))
              )}
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <pre className="p-4 text-xs font-mono whitespace-pre">{jsonString}</pre>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 shrink-0 pt-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 bg-transparent">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy All"}
          </Button>
          <Button size="sm" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
