// ─��────────────────────────────────────────────────────
// Local types for the sync server relay.
// Mirrors @dnd-agent/shared/types/world but avoids
// workspace ESM resolution issues with tsx.
// ───��────────────────��─────────────────────────────────

export interface WorldEntity {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number; z: number };
  color: string;
  status?: EntityStatus;
  spawned_at: number;
}

export interface EntityStatus {
  health?: { current: number; max: number };
  condition?: string;
}

export interface CameraDirective {
  target: { x: number; y: number; z: number };
  duration: number;
  returnControl: boolean;
  started_at: number;
}

export interface NarrativeEvent {
  id: string;
  text: string;
  style: string;
  timestamp: number;
  displayDuration: number;
}

export interface GameState {
  entities: Record<string, WorldEntity>;
  lighting: string;
  mood: string;
  cameraDirective: CameraDirective | null;
  narrativeQueue: NarrativeEvent[];
  revealedPOIs: string[];
  fogRevealed: boolean;
}

export type GameMutation =
  | { action: "spawn_entity"; entity: WorldEntity }
  | { action: "move_entity"; entityId: string; position: { x: number; y: number; z: number } }
  | { action: "remove_entity"; entityId: string }
  | { action: "set_lighting"; preset: string }
  | { action: "set_mood"; mood: string }
  | { action: "focus_camera"; directive: CameraDirective }
  | { action: "reveal_poi"; poiId: string }
  | { action: "narrate"; event: NarrativeEvent }
  | { action: "update_entity_status"; entityId: string; status: EntityStatus }
  | { action: "fog_reveal" };

export type WSMessage =
  | { type: "full_state"; state: GameState }
  | { type: "mutation"; mutation: GameMutation };
