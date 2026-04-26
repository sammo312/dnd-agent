"use client";

import { useState } from "react";
import { useStoryStore } from "../../lib/story-store";
import { Button } from "@dnd-agent/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@dnd-agent/ui/components/dialog";
import { Textarea } from "@dnd-agent/ui/components/textarea";
import {
  Layers,
  MessageSquare,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Home,
  Presentation,
} from "lucide-react";
import type { StoryNode, Section, DialogueNode, ExportedChapter } from "../../lib/story-types";
import { ExportPanel } from "./export-panel";
import { PresentationMode } from "./presentation-mode";

interface ToolbarProps {
  compact?: boolean;
}

export function Toolbar({ compact = false }: ToolbarProps) {
  const {
    addNode,
    nodes,
    exportToJson,
    importFromJson,
    zoom,
    setZoom,
    setCanvasOffset,
  } = useStoryStore();
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [presentationOpen, setPresentationOpen] = useState(false);

  const handleAddSection = () => {
    const newId = `section_${Date.now()}`;
    const existingSections = nodes.filter((n) => n.type === "section");
    const newNode: StoryNode = {
      id: newId,
      type: "section",
      position: {
        x: 100 + existingSections.length * 50,
        y: 100 + existingSections.length * 50,
      },
      data: {
        id: newId,
        name: `section_${existingSections.length + 1}`,
        start_id: "",
      } as Section,
    };
    addNode(newNode);
  };

  const handleAddDialogue = () => {
    const newId = `dialogue_${Date.now()}`;
    const existingDialogues = nodes.filter((n) => n.type === "dialogue");
    const newNode: StoryNode = {
      id: newId,
      type: "dialogue",
      position: {
        x: 450 + existingDialogues.length * 30,
        y: 100 + existingDialogues.length * 30,
      },
      data: {
        id: newId,
        speaker: "Character",
        dialogue: [{ text: "New dialogue...", speed: 80 }],
        choices: [],
      } as DialogueNode,
    };
    addNode(newNode);
  };

  const handleExport = () => {
    const exportData = exportToJson();
    return JSON.stringify(exportData, null, 2);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importData) as ExportedChapter[];
      if (Array.isArray(data) && data.length > 0) {
        // Check if it looks like the new chapter format: [{ "chapterName": { nodes: [...] } }]
        const firstKey = Object.keys(data[0])[0];
        const firstChapter = data[0][firstKey];
        if (firstKey && firstChapter && Array.isArray(firstChapter.nodes)) {
          importFromJson(data);
          setImportOpen(false);
          setImportData("");
          return;
        }
      }
      alert('Invalid format. Expected [{ "chapterName": { nodes: [...] } }]');
    } catch {
      alert("Invalid JSON");
    }
  };

  const handleDownload = () => {
    const json = handleExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "story-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetView = () => {
    setZoom(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-card border-b border-border">
      {/* Add Nodes */}
      <div className="flex items-center gap-1 pr-3 border-r border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddSection}
          className="gap-2 bg-transparent"
        >
          <Layers className="w-4 h-4 text-node-scene" />
          {!compact && <span className="hidden sm:inline">Add Section</span>}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddDialogue}
          className="gap-2 bg-transparent"
        >
          <MessageSquare className="w-4 h-4 text-node-dialogue" />
          {!compact && <span className="hidden sm:inline">Add Dialogue</span>}
        </Button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 pr-3 border-r border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom(zoom - 0.1)}
          className="h-8 w-8"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleResetView}
          className="h-8 w-8"
        >
          <Home className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom(zoom + 0.1)}
          className="h-8 w-8"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      {/* Presentation Mode */}
      <div className="flex items-center gap-1 pr-3 border-r border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPresentationOpen(true)}
          className="gap-2 bg-transparent"
        >
          <Presentation className="w-4 h-4 text-primary" />
          {!compact && <span className="hidden sm:inline">Present</span>}
        </Button>
      </div>

      {/* Import/Export */}
      <div className="flex items-center gap-1 ml-auto">
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              {!compact && <span className="hidden sm:inline">Import</span>}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Import Story Data</DialogTitle>
              <DialogDescription>
                Paste your story JSON data below (format: [{'{ "chapterName": { nodes: [...] } }'}])
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder='[{ "Chapter 1": { "nodes": [{ "id": "...", "speaker": "...", "dialogue": [...] }] } }]'
              className="flex-1 min-h-[200px] max-h-[400px] font-mono text-xs resize-none"
            />
            <div className="flex justify-end gap-2 flex-shrink-0 pt-2">
              <Button variant="outline" onClick={() => setImportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport}>Import</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="ghost" size="sm" className="gap-2" onClick={() => setExportOpen(true)}>
          <Download className="w-4 h-4" />
          {!compact && <span className="hidden sm:inline">Export</span>}
        </Button>
        <ExportPanel
          open={exportOpen}
          onOpenChange={setExportOpen}
          data={exportToJson()}
        />
      </div>

      {/* Presentation Mode */}
      {presentationOpen && (
        <PresentationMode
          data={exportToJson()}
          onClose={() => setPresentationOpen(false)}
        />
      )}
    </div>
  );
}
