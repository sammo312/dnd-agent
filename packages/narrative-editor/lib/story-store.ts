import { create } from 'zustand';
import type { StoryNode, Connection, DialogueNode, Section, Choice, ExportedDialogue, ExportedChapter, ExportedChapterData } from './story-types';

interface StoryStore {
  nodes: StoryNode[];
  connections: Connection[];
  selectedNodeId: string | null;
  canvasOffset: { x: number; y: number };
  zoom: number;

  // Actions
  addNode: (node: StoryNode) => void;
  updateNode: (id: string, data: Partial<StoryNode['data']>) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  selectNode: (id: string | null) => void;

  addConnection: (connection: Connection) => void;
  deleteConnection: (id: string) => void;

  setCanvasOffset: (offset: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;

  // Dialogue specific
  addDialogueSegment: (nodeId: string) => void;
  addDialogueSegmentAt: (nodeId: string, index: number) => void;
  updateDialogueSegment: (nodeId: string, index: number, segment: Partial<{ text: string; speed: number; style?: { color?: string } }>) => void;
  deleteDialogueSegment: (nodeId: string, index: number) => void;
  setDialogueSegments: (nodeId: string, segments: DialogueNode['dialogue']) => void;

  addChoice: (nodeId: string) => void;
  updateChoice: (nodeId: string, index: number, choice: Partial<Choice>) => void;
  deleteChoice: (nodeId: string, index: number) => void;

  // Export - chapter format: [{ id, title, background, music, gltf, nodes: [...] }]
  exportToJson: () => ExportedChapter[];

  // Import - from chapter format
  importFromJson: (data: ExportedChapter[]) => void;
}

// Empty by default — the DM prep assistant fills this in via tool calls.
const initialNodes: StoryNode[] = [];
const initialConnections: Connection[] = [];

export const useStoryStore = create<StoryStore>((set, get) => ({
  nodes: initialNodes,
  connections: initialConnections,
  selectedNodeId: null,
  canvasOffset: { x: 0, y: 0 },
  zoom: 1,

  addNode: (node) =>
    set((state) => ({ nodes: [...state.nodes, node] })),

  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      connections: state.connections.filter(
        (c) => c.from !== id && c.to !== id
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    })),

  moveNode: (id, position) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, position } : n
      ),
    })),

  selectNode: (id) => set({ selectedNodeId: id }),

  addConnection: (connection) =>
    set((state) => {
      const fromNode = state.nodes.find((n) => n.id === connection.from);
      const toNode = state.nodes.find((n) => n.id === connection.to);

      if (!fromNode || !toNode) {
        return { connections: [...state.connections, connection] };
      }

      // Auto-populate ID pointers based on connection type
      let updatedNodes = state.nodes;

      if (fromNode.type === 'section' && toNode.type === 'dialogue') {
        // Section -> Dialogue: set section's start_id to dialogue's id
        const toDialogueData = toNode.data as DialogueNode;
        updatedNodes = state.nodes.map((n) =>
          n.id === fromNode.id
            ? { ...n, data: { ...(n.data as Section), start_id: toDialogueData.id } }
            : n
        );
      } else if (fromNode.type === 'dialogue' && toNode.type === 'dialogue' && connection.label) {
        // Dialogue -> Dialogue with label: update the choice's id to target dialogue
        const toDialogueData = toNode.data as DialogueNode;
        updatedNodes = state.nodes.map((n) => {
          if (n.id === fromNode.id && n.type === 'dialogue') {
            const data = n.data as DialogueNode;
            const updatedChoices = data.choices.map((choice) =>
              choice.label === connection.label
                ? { ...choice, id: toDialogueData.id }
                : choice
            );
            return { ...n, data: { ...data, choices: updatedChoices } };
          }
          return n;
        });
      }

      return {
        nodes: updatedNodes,
        connections: [...state.connections, connection],
      };
    }),

  deleteConnection: (id) =>
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
    })),

  setCanvasOffset: (canvasOffset) => set({ canvasOffset }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),

  addDialogueSegment: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === nodeId && n.type === 'dialogue') {
          const data = n.data as DialogueNode;
          return {
            ...n,
            data: {
              ...data,
              dialogue: [...data.dialogue, { text: '', speed: 80 }],
            },
          };
        }
        return n;
      }),
    })),

  addDialogueSegmentAt: (nodeId, index) =>
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === nodeId && n.type === 'dialogue') {
          const data = n.data as DialogueNode;
          const newDialogue = [...data.dialogue];
          newDialogue.splice(index, 0, { text: '', speed: 80 });
          return {
            ...n,
            data: {
              ...data,
              dialogue: newDialogue,
            },
          };
        }
        return n;
      }),
    })),

  updateDialogueSegment: (nodeId, index, segment) =>
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === nodeId && n.type === 'dialogue') {
          const data = n.data as DialogueNode;
          const newDialogue = [...data.dialogue];
          newDialogue[index] = { ...newDialogue[index], ...segment };
          return { ...n, data: { ...data, dialogue: newDialogue } };
        }
        return n;
      }),
    })),

  deleteDialogueSegment: (nodeId, index) =>
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === nodeId && n.type === 'dialogue') {
          const data = n.data as DialogueNode;
          return {
            ...n,
            data: {
              ...data,
              dialogue: data.dialogue.filter((_, i) => i !== index),
            },
          };
        }
        return n;
      }),
    })),

  setDialogueSegments: (nodeId, segments) =>
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === nodeId && n.type === 'dialogue') {
          const data = n.data as DialogueNode;
          return {
            ...n,
            data: {
              ...data,
              dialogue: segments,
            },
          };
        }
        return n;
      }),
    })),

  addChoice: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === nodeId && n.type === 'dialogue') {
          const data = n.data as DialogueNode;
          return {
            ...n,
            data: {
              ...data,
              choices: [...data.choices, { label: 'New choice', id: `choice_${Date.now()}` }],
            },
          };
        }
        return n;
      }),
    })),

  updateChoice: (nodeId, index, choice) =>
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === nodeId && n.type === 'dialogue') {
          const data = n.data as DialogueNode;
          const newChoices = [...data.choices];
          newChoices[index] = { ...newChoices[index], ...choice };
          return { ...n, data: { ...data, choices: newChoices } };
        }
        return n;
      }),
    })),

  deleteChoice: (nodeId, index) =>
    set((state) => {
      const node = state.nodes.find((n) => n.id === nodeId);
      if (!node || node.type !== 'dialogue') return state;

      const data = node.data as DialogueNode;
      const choiceToDelete = data.choices[index];

      return {
        nodes: state.nodes.map((n) => {
          if (n.id === nodeId && n.type === 'dialogue') {
            return {
              ...n,
              data: {
                ...data,
                choices: data.choices.filter((_, i) => i !== index),
              },
            };
          }
          return n;
        }),
        connections: state.connections.filter(
          (c) => !(c.from === nodeId && c.label === choiceToDelete.label)
        ),
      };
    }),

  // Export to chapter format: [{ "chapter_name": { gltf, music, nodes: [...] } }]
  exportToJson: () => {
    const { nodes } = get();
    const sections = nodes.filter((n) => n.type === 'section');
    const dialogueNodes = nodes.filter((n) => n.type === 'dialogue');

    // Build a map of dialogue nodes by their DATA id (not the store node id)
    const dialogueMap = new Map<string, DialogueNode>();
    dialogueNodes.forEach((n) => {
      const data = n.data as DialogueNode;
      dialogueMap.set(data.id, data);
    });

    // For each section (chapter), traverse from start_id and collect all reachable dialogues
    const result: ExportedChapter[] = [];

    sections.forEach((sectionNode) => {
      const section = sectionNode.data as Section;
      const chapterDialogues: ExportedDialogue[] = [];
      const visited = new Set<string>();
      const queue: string[] = [];

      // Start from the section's start_id
      if (section.start_id && dialogueMap.has(section.start_id)) {
        queue.push(section.start_id);
      }

      // BFS to collect all reachable dialogues in order
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const dialogue = dialogueMap.get(currentId);
        if (dialogue) {
          // Create export format - only include overrides (not chapter defaults)
          const exported: ExportedDialogue = {
            id: dialogue.id,
            speaker: dialogue.speaker,
            dialogue: dialogue.dialogue,
          };

          // Only include if different from chapter defaults (override)
          if (dialogue.gltf && dialogue.gltf !== section.gltf) exported.gltf = dialogue.gltf;
          if (dialogue.background && dialogue.background !== section.background) exported.background = dialogue.background;
          if (dialogue.music && dialogue.music !== section.music) exported.music = dialogue.music;

          if (dialogue.choices && dialogue.choices.length > 0) {
            exported.choices = dialogue.choices;
            // Add choice targets to queue
            dialogue.choices.forEach((choice) => {
              if (!visited.has(choice.id)) {
                queue.push(choice.id);
              }
            });
          }

          chapterDialogues.push(exported);
        }
      }

      // Create chapter data object
      const chapterData: ExportedChapterData = {
        nodes: chapterDialogues,
      };

      if (section.background) chapterData.background = section.background;
      if (section.music) chapterData.music = section.music;
      if (section.gltf) chapterData.gltf = section.gltf;

      // Create chapter with name as key
      result.push({
        [section.name]: chapterData,
      });
    });

    return result;
  },

  // Import from chapter format: [{ "chapter_name": { gltf, music, nodes: [...] } }]
  importFromJson: (data: ExportedChapter[]) => {
    const nodes: StoryNode[] = [];
    const connections: Connection[] = [];
    let dialogueStartX = 450;

    data.forEach((chapterObj, chapterIndex) => {
      // Get the chapter name (the key) and chapter data (the value)
      const chapterName = Object.keys(chapterObj)[0];
      const chapter = chapterObj[chapterName];

      if (!chapter || !chapter.nodes || chapter.nodes.length === 0) return;

      const dialogues = chapter.nodes;
      const sectionId = `section_${chapterName}`;
      const startId = dialogues[0]?.id || '';

      // Create section (chapter) node with metadata
      nodes.push({
        id: sectionId,
        type: 'section',
        position: { x: 100, y: 100 + chapterIndex * 400 },
        data: {
          id: chapterName,
          name: chapterName,
          start_id: startId,
          background: chapter.background,
          music: chapter.music,
          gltf: chapter.gltf,
        } as Section,
      });

      // Create dialogue nodes with auto-layout
      const dialogueMap = new Map<string, number>();
      dialogues.forEach((dialogue, i) => {
        dialogueMap.set(dialogue.id, i);
      });

      // Calculate positions based on branching
      const positions = new Map<string, { x: number; y: number }>();
      const visited = new Set<string>();
      const queue: Array<{ id: string; depth: number; branch: number }> = [];

      if (startId) {
        queue.push({ id: startId, depth: 0, branch: 0 });
      }

      while (queue.length > 0) {
        const { id, depth, branch } = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);

        const dialogueIndex = dialogueMap.get(id);
        if (dialogueIndex === undefined) continue;

        const dialogue = dialogues[dialogueIndex];

        positions.set(id, {
          x: dialogueStartX + depth * 350,
          y: 100 + chapterIndex * 400 + branch * 180,
        });

        if (dialogue.choices) {
          dialogue.choices.forEach((choice, choiceIndex) => {
            if (!visited.has(choice.id)) {
              queue.push({
                id: choice.id,
                depth: depth + 1,
                branch: branch + choiceIndex,
              });
            }
          });
        }
      }

      // Create dialogue nodes
      dialogues.forEach((dialogue) => {
        const pos = positions.get(dialogue.id) || {
          x: dialogueStartX,
          y: 100 + chapterIndex * 400 + nodes.filter(n => n.type === 'dialogue').length * 180,
        };

        nodes.push({
          id: dialogue.id,
          type: 'dialogue',
          position: pos,
          data: {
            id: dialogue.id,
            speaker: dialogue.speaker,
            gltf: dialogue.gltf,
            background: dialogue.background,
            music: dialogue.music,
            dialogue: dialogue.dialogue,
            choices: dialogue.choices || [],
          } as DialogueNode,
        });

        // Create connections for choices
        if (dialogue.choices) {
          dialogue.choices.forEach((choice) => {
            connections.push({
              id: `conn_${dialogue.id}_${choice.id}`,
              from: dialogue.id,
              to: choice.id,
              label: choice.label,
            });
          });
        }
      });

      // Connect section to start dialogue
      if (startId) {
        connections.push({
          id: `conn_${sectionId}_${startId}`,
          from: sectionId,
          to: startId,
          label: 'starts',
        });
      }
    });

    set({ nodes, connections });
  },
}));
