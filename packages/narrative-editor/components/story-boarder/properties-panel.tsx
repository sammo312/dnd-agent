"use client";

import { useStoryStore } from "../../lib/story-store";
import { Input } from "@dnd-agent/ui/components/input";
import { Label } from "@dnd-agent/ui/components/label";
import { Button } from "@dnd-agent/ui/components/button";
import { Separator } from "@dnd-agent/ui/components/separator";
import { ScrollArea } from "@dnd-agent/ui/components/scroll-area";
import { Plus, Trash2, Layers, MessageSquare, X } from "lucide-react";
import type { DialogueNode, Section } from "../../lib/story-types";
import { DialogueSegmentEditor } from "./dialogue-segment-editor";

export function PropertiesPanel() {
  const {
    nodes,
    selectedNodeId,
    updateNode,
    selectNode,
    addChoice,
    updateChoice,
    deleteChoice,
  } = useStoryStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
        <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">Select a node to edit its properties</p>
      </div>
    );
  }

  const isSection = selectedNode.type === "section";
  const data = selectedNode.data;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSection ? (
              <Layers className="w-5 h-5 text-node-scene" />
            ) : (
              <MessageSquare className="w-5 h-5 text-node-dialogue" />
            )}
            <h2 className="font-semibold text-foreground">
              {isSection ? "Section" : "Dialogue"}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => selectNode(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Separator />

        {/* Section (Chapter) Properties */}
        {isSection && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Chapter ID</Label>
                <Input
                  id="name"
                  value={(data as Section).name}
                  onChange={(e) =>
                    updateNode(selectedNode.id, { name: e.target.value })
                  }
                  placeholder="awakening"
                  className="bg-input font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={(data as Section).title || ""}
                  onChange={(e) =>
                    updateNode(selectedNode.id, { title: e.target.value || undefined })
                  }
                  placeholder="Awakening"
                  className="bg-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_id">Start Node ID</Label>
              <Input
                id="start_id"
                value={(data as Section).start_id}
                onChange={(e) =>
                  updateNode(selectedNode.id, { start_id: e.target.value })
                }
                placeholder="first_dialogue_id"
                className="bg-input font-mono text-xs"
              />
            </div>

            <Separator />

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Chapter Defaults</Label>
              <p className="text-xs text-muted-foreground">
                Dialogue nodes inherit these unless they override
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapter_bg">Background Image</Label>
              <Input
                id="chapter_bg"
                value={(data as Section).background || ""}
                onChange={(e) =>
                  updateNode(selectedNode.id, { background: e.target.value || undefined })
                }
                placeholder="res://chapter_bg.png"
                className="bg-input font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapter_music">Music</Label>
              <Input
                id="chapter_music"
                value={(data as Section).music || ""}
                onChange={(e) =>
                  updateNode(selectedNode.id, { music: e.target.value || undefined })
                }
                placeholder="res://chapter_theme.mp3"
                className="bg-input font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapter_gltf">3D Model (GLTF)</Label>
              <Input
                id="chapter_gltf"
                value={(data as Section).gltf || ""}
                onChange={(e) =>
                  updateNode(selectedNode.id, { gltf: e.target.value || undefined })
                }
                placeholder="res://chapter_mask.gltf"
                className="bg-input font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* Dialogue Properties */}
        {!isSection && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id">ID</Label>
                <Input
                  id="id"
                  value={(data as DialogueNode).id}
                  onChange={(e) =>
                    updateNode(selectedNode.id, { id: e.target.value })
                  }
                  className="bg-input font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speaker">Speaker</Label>
                <Input
                  id="speaker"
                  value={(data as DialogueNode).speaker}
                  onChange={(e) =>
                    updateNode(selectedNode.id, { speaker: e.target.value })
                  }
                  className="bg-input"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Overrides</Label>
              <p className="text-xs text-muted-foreground">
                Leave empty to use chapter defaults
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background">Background Image</Label>
              <Input
                id="background"
                value={(data as DialogueNode).background || ""}
                onChange={(e) =>
                  updateNode(selectedNode.id, {
                    background: e.target.value || undefined,
                  })
                }
                placeholder="res://override_bg.png"
                className="bg-input font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="music">Music</Label>
              <Input
                id="music"
                value={(data as DialogueNode).music || ""}
                onChange={(e) =>
                  updateNode(selectedNode.id, {
                    music: e.target.value || undefined,
                  })
                }
                placeholder="res://override_music.mp3"
                className="bg-input font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gltf">3D Model (GLTF)</Label>
              <Input
                id="gltf"
                value={(data as DialogueNode).gltf || ""}
                onChange={(e) =>
                  updateNode(selectedNode.id, {
                    gltf: e.target.value || undefined,
                  })
                }
                placeholder="res://override_model.gltf"
                className="bg-input font-mono text-xs"
              />
            </div>

            <Separator />

            {/* Dialogue Segments - Paragraph View */}
            <DialogueSegmentEditor
              nodeId={selectedNode.id}
              dialogue={(data as DialogueNode).dialogue}
              speaker={(data as DialogueNode).speaker}
            />

            <Separator />

            {/* Choices */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Choices (Branches)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addChoice(selectedNode.id)}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {(data as DialogueNode).choices.map((choice, index) => (
                  <div
                    key={choice.id}
                    className="p-3 bg-node-choice/10 rounded-md border border-node-choice/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-node-choice">
                        Choice {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteChoice(selectedNode.id, index)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Label
                        </Label>
                        <Input
                          value={choice.label}
                          onChange={(e) =>
                            updateChoice(selectedNode.id, index, {
                              label: e.target.value,
                            })
                          }
                          placeholder="Choice text..."
                          className="bg-input text-xs h-8"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Target ID
                        </Label>
                        <Input
                          value={choice.id}
                          onChange={(e) =>
                            updateChoice(selectedNode.id, index, {
                              id: e.target.value,
                            })
                          }
                          placeholder="next_dialogue_id"
                          className="bg-input text-xs h-8 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {(data as DialogueNode).choices.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No choices. This dialogue will end or continue linearly.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
