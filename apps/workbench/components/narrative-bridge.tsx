"use client";

import { useEffect } from "react";
import { useStoryStore } from "@dnd-agent/narrative-editor";
import { useMapStore } from "@dnd-agent/map-editor/lib/map-store";
import type { SharedNarrativeSchema } from "@dnd-agent/map-editor/lib/map-store";
import type { DialogueNode, Section } from "@dnd-agent/narrative-editor";

/**
 * Lives at the workbench layout level. Subscribes to the story-boarder's
 * authoritative state (`useStoryStore.nodes`) and republishes a derived
 * `NarrativeSchema` to the shared map store, so the Map Editor's Story
 * tab and POI association dropdowns stay in sync without any manual
 * import/export step.
 *
 * Renders nothing; effect-only.
 */
export function NarrativeBridge() {
  const nodes = useStoryStore((s) => s.nodes);
  const publishNarrativeSchema = useMapStore((s) => s.publishNarrativeSchema);

  useEffect(() => {
    const sections = nodes.filter((n) => n.type === "section");
    const dialogues = new Map<string, DialogueNode>();
    for (const n of nodes) {
      if (n.type === "dialogue") {
        const d = n.data as DialogueNode;
        dialogues.set(d.id, d);
      }
    }

    if (sections.length === 0) {
      publishNarrativeSchema(null);
      return;
    }

    const schema: SharedNarrativeSchema = {};
    for (const sectionNode of sections) {
      const section = sectionNode.data as Section;

      // Walk reachable dialogues from start_id, breadth-first, so the
      // node order in the schema matches what the player will see.
      const visited = new Set<string>();
      const queue: string[] = [];
      const collected: SharedNarrativeSchema[string]["nodes"] = [];

      if (section.start_id && dialogues.has(section.start_id)) {
        queue.push(section.start_id);
      }

      while (queue.length > 0) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);

        const d = dialogues.get(id);
        if (!d) continue;

        collected.push({
          id: d.id,
          speaker: d.speaker,
          dialogue: d.dialogue.map((seg) => ({ text: seg.text })),
          gltf: d.gltf,
          choices: d.choices?.length
            ? d.choices.map((c) => ({ label: c.label, id: c.id }))
            : undefined,
        });

        if (d.choices) {
          for (const c of d.choices) {
            if (!visited.has(c.id)) queue.push(c.id);
          }
        }
      }

      schema[section.name] = {
        nodes: collected,
        background: section.background,
        music: section.music,
        gltf: section.gltf,
      };
    }

    publishNarrativeSchema(schema);
  }, [nodes, publishNarrativeSchema]);

  return null;
}
