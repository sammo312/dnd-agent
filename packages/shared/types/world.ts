// ──────────────────────────────────────────────────────
// World state types for the Living Stage sync server.
//
// Data flow:
//   DM/Player → POST /chat → sync server → Claude API
//   Claude tool call → mutate GameState → WS broadcast
//   Player app receives mutation → renders 3D change
// ──────────────────────────────────────────────────────

export interface WorldEntity {
  id: string;
  type: string; // "dragon", "skeleton", "npc_mayor", etc.
  name: string;
  position: { x: number; y: number; z: number };
  color: string; // hex color for capsule mesh
  status?: EntityStatus;
  spawned_at: number; // timestamp for spawn animation
}

export interface EntityStatus {
  health?: { current: number; max: number };
  condition?: string; // "frightened", "poisoned", etc.
}

export type LightingPreset =
  | "daylight"
  | "moonlit"
  | "dramatic_red"
  | "firelight"
  | "storm"
  | "dim"
  | "sunrise";

export type MoodPreset =
  | "calm"
  | "tense"
  | "combat"
  | "celebration"
  | "mystery";

export type NarrativeStyle =
  | "normal"
  | "whisper"
  | "shout"
  | "dramatic"
  | "system";

export interface CameraDirective {
  target: { x: number; y: number; z: number };
  duration: number; // seconds
  returnControl: boolean;
  started_at: number;
}

export interface NarrativeEvent {
  id: string;
  text: string;
  style: NarrativeStyle;
  timestamp: number;
  displayDuration: number; // seconds, 0 = permanent until scrolled off
}

export interface GameState {
  entities: Record<string, WorldEntity>;
  lighting: LightingPreset;
  mood: MoodPreset;
  cameraDirective: CameraDirective | null;
  narrativeQueue: NarrativeEvent[];
  revealedPOIs: string[];
  fogRevealed: boolean; // starts false, set true on first narration
}

// Entity color mapping by category
export const ENTITY_COLORS: Record<string, string> = {
  hostile: "#ef4444", // red
  friendly: "#3b82f6", // blue
  quest: "#eab308", // gold
  neutral: "#22c55e", // green
};

// Max entities in the world
export const MAX_ENTITIES = 50;

// Max narrative events in queue
export const MAX_NARRATIVE_QUEUE = 20;

// WebSocket message types
export type WSMessage =
  | { type: "full_state"; state: GameState }
  | { type: "mutation"; mutation: GameMutation }
  | { type: "narration_stream"; text: string; done: boolean };

export type GameMutation =
  | { action: "spawn_entity"; entity: WorldEntity }
  | { action: "move_entity"; entityId: string; position: { x: number; y: number; z: number } }
  | { action: "remove_entity"; entityId: string }
  | { action: "set_lighting"; preset: LightingPreset }
  | { action: "set_mood"; mood: MoodPreset }
  | { action: "focus_camera"; directive: CameraDirective }
  | { action: "reveal_poi"; poiId: string }
  | { action: "narrate"; event: NarrativeEvent }
  | { action: "update_entity_status"; entityId: string; status: EntityStatus }
  | { action: "fog_reveal" };

export function createInitialGameState(): GameState {
  return {
    entities: {},
    lighting: "daylight",
    mood: "calm",
    cameraDirective: null,
    narrativeQueue: [],
    revealedPOIs: [],
    fogRevealed: false,
  };
}
