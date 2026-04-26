import { tool } from 'ai';
import { z } from 'zod';

// ──────────────────────────────────────────────────────
// World mutation tools for the Living Stage.
//
// These tools run inside the Next.js API route alongside
// existing dmTools. The Vercel AI SDK handles tool calling,
// streaming, and multi-step loops via streamText + useChat.
//
// Each tool:
//   1. Builds a mutation payload
//   2. POSTs it to the sync server relay (localhost:3002/mutate)
//   3. Sync server applies the mutation and broadcasts via WS
//   4. Returns a result to Claude for the next step
//
// Coordinate convention:
//   x = column (left/right), z = row (forward/back)
//   Tool sets y = 0 (ground level) automatically.
// ──────────────────────────────────────────────────────

const SYNC_URL = process.env.SYNC_SERVER_URL || 'http://localhost:3002';

const ENTITY_COLORS: Record<string, string> = {
  hostile: '#ef4444',
  friendly: '#3b82f6',
  quest: '#eab308',
  neutral: '#22c55e',
};

// In-memory entity tracker (server-side, persists across requests in dev)
const entityMap = new Map<string, { id: string; type: string; name: string; position: { x: number; y: number; z: number } }>();

async function postMutation(mutation: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${SYNC_URL}/mutate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mutation),
    });
    return await res.json() as { ok: boolean; error?: string };
  } catch (err) {
    return { ok: false, error: `Sync server unreachable: ${err}` };
  }
}

function categoryFromType(type: string): string {
  const lower = type.toLowerCase();
  if (['dragon', 'skeleton', 'bandit', 'goblin', 'wolf', 'spider', 'undead', 'demon', 'orc'].some(h => lower.includes(h))) return 'hostile';
  if (['stranger', 'quest', 'mysterious', 'wizard', 'sage'].some(q => lower.includes(q))) return 'quest';
  if (['barkeep', 'mayor', 'guard', 'merchant', 'villager', 'farmer', 'priest'].some(f => lower.includes(f))) return 'friendly';
  return 'neutral';
}

// ── Tools ────────────────────────────────────────────

export const spawnEntityTool = tool({
  description: 'Spawn a creature, NPC, or object in the 3D world. Returns entity ID for future reference. Use x for left/right position, z for forward/back.',
  parameters: z.object({
    type: z.string().describe('Entity type, e.g. "dragon", "skeleton", "npc_barkeep"'),
    x: z.number().describe('Grid column position (left/right)'),
    z: z.number().describe('Grid row position (forward/back)'),
    name: z.string().optional().describe('Display name. Auto-generated if omitted.'),
    category: z.enum(['hostile', 'friendly', 'quest', 'neutral']).optional(),
  }),
  execute: async ({ type, x, z: zPos, name, category }) => {
    const id = `entity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const cat = category || categoryFromType(type);
    const color = ENTITY_COLORS[cat] || ENTITY_COLORS.neutral;
    const displayName = name || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const entity = {
      id, type, name: displayName,
      position: { x, y: 0, z: zPos },
      color, spawned_at: Date.now(),
    };

    const result = await postMutation({ action: 'spawn_entity', entity });
    if (!result.ok) return { error: result.error };

    entityMap.set(id, { id, type, name: displayName, position: entity.position });
    return { entityId: id, name: displayName, position: entity.position };
  },
});

export const moveEntityTool = tool({
  description: 'Move an existing entity to a new position. Call listEntities first if you need the entity ID.',
  parameters: z.object({
    entityId: z.string().describe('Entity ID from spawnEntity'),
    x: z.number().describe('New grid column'),
    z: z.number().describe('New grid row'),
  }),
  execute: async ({ entityId, x, z: zPos }) => {
    if (!entityMap.has(entityId)) {
      return { error: `Entity "${entityId}" not found. Call listEntities to see available entities.` };
    }
    const position = { x, y: 0, z: zPos };
    const result = await postMutation({ action: 'move_entity', entityId, position });
    if (!result.ok) return { error: result.error };

    const e = entityMap.get(entityId)!;
    e.position = position;
    return { moved: true, entityId, newPosition: position };
  },
});

export const removeEntityTool = tool({
  description: 'Remove an entity from the world (death, departure, vanishing).',
  parameters: z.object({
    entityId: z.string().describe('Entity ID to remove'),
  }),
  execute: async ({ entityId }) => {
    if (!entityMap.has(entityId)) {
      return { error: `Entity "${entityId}" not found. Call listEntities to see available entities.` };
    }
    const result = await postMutation({ action: 'remove_entity', entityId });
    if (!result.ok) return { error: result.error };

    entityMap.delete(entityId);
    return { removed: true, entityId };
  },
});

export const setLightingTool = tool({
  description: 'Change scene lighting. Affects the visual atmosphere of the 3D world.',
  parameters: z.object({
    preset: z.enum(['daylight', 'moonlit', 'dramatic_red', 'firelight', 'storm', 'dim', 'sunrise']),
  }),
  execute: async ({ preset }) => {
    await postMutation({ action: 'set_lighting', preset });
    return { lighting: preset };
  },
});

export const setMoodTool = tool({
  description: 'Set ambient mood. Changes ambient light color and intensity.',
  parameters: z.object({
    mood: z.enum(['calm', 'tense', 'combat', 'celebration', 'mystery']),
  }),
  execute: async ({ mood }) => {
    await postMutation({ action: 'set_mood', mood });
    return { mood };
  },
});

export const focusCameraTool = tool({
  description: 'Point the player camera at a position. Camera pans smoothly, then returns to player control.',
  parameters: z.object({
    x: z.number().describe('Target grid column'),
    z: z.number().describe('Target grid row'),
    duration: z.number().optional().describe('Pan duration in seconds (default 2)'),
    returnControl: z.boolean().optional().describe('Return camera to player after (default true)'),
  }),
  execute: async ({ x, z: zPos, duration, returnControl }) => {
    const directive = {
      target: { x, y: 0, z: zPos },
      duration: duration ?? 2,
      returnControl: returnControl ?? true,
      started_at: Date.now(),
    };
    await postMutation({ action: 'focus_camera', directive });
    return { camera: 'moving', target: directive.target, duration: directive.duration };
  },
});

export const revealPOITool = tool({
  description: 'Reveal a hidden point of interest (secret door, hidden path, treasure).',
  parameters: z.object({
    poiId: z.string().describe('POI identifier to reveal'),
  }),
  execute: async ({ poiId }) => {
    await postMutation({ action: 'reveal_poi', poiId });
    return { revealed: poiId };
  },
});

export const narrateTool = tool({
  description: 'Display narrative text on the player screen. ALWAYS use this to tell the player what is happening.',
  parameters: z.object({
    text: z.string().describe('Narrative text to display'),
    style: z.enum(['normal', 'whisper', 'shout', 'dramatic', 'system']).optional(),
    displayDuration: z.number().optional().describe('Seconds to show. Default 10.'),
  }),
  execute: async ({ text, style, displayDuration }) => {
    if (!text?.trim()) return { error: 'Narration text cannot be empty.' };

    const event = {
      id: `narr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      style: style || 'normal',
      timestamp: Date.now(),
      displayDuration: displayDuration ?? 10,
    };
    await postMutation({ action: 'narrate', event });
    return { narrated: true, style: event.style };
  },
});

export const listEntitiesTool = tool({
  description: 'List all entities in the world with IDs, types, names, positions. Use before moveEntity or removeEntity.',
  parameters: z.object({}),
  execute: async () => {
    const entities = Array.from(entityMap.values());
    return { entities, count: entities.length };
  },
});

// Bundle all world tools
export const worldTools = {
  spawnEntity: spawnEntityTool,
  moveEntity: moveEntityTool,
  removeEntity: removeEntityTool,
  setLighting: setLightingTool,
  setMood: setMoodTool,
  focusCamera: focusCameraTool,
  revealPOI: revealPOITool,
  narrate: narrateTool,
  listEntities: listEntitiesTool,
};
