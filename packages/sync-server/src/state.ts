import type { GameState, GameMutation } from "./types.js";

const MAX_ENTITIES = 50;
const MAX_NARRATIVE_QUEUE = 20;

let gameState: GameState = createInitialState();

function createInitialState(): GameState {
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

export function getState(): GameState {
  return gameState;
}

export function resetState(): void {
  gameState = createInitialState();
}

export function applyMutation(mutation: GameMutation): { ok: boolean; error?: string } {
  switch (mutation.action) {
    case "spawn_entity": {
      if (Object.keys(gameState.entities).length >= MAX_ENTITIES) {
        return { ok: false, error: `Entity limit reached (${MAX_ENTITIES}). Remove an entity first.` };
      }
      gameState.entities[mutation.entity.id] = mutation.entity;
      return { ok: true };
    }
    case "move_entity": {
      if (!gameState.entities[mutation.entityId]) {
        return { ok: false, error: `Entity "${mutation.entityId}" not found.` };
      }
      gameState.entities[mutation.entityId].position = mutation.position;
      return { ok: true };
    }
    case "remove_entity": {
      if (!gameState.entities[mutation.entityId]) {
        return { ok: false, error: `Entity "${mutation.entityId}" not found.` };
      }
      delete gameState.entities[mutation.entityId];
      return { ok: true };
    }
    case "set_lighting":
      gameState.lighting = mutation.preset;
      return { ok: true };
    case "set_mood":
      gameState.mood = mutation.mood;
      return { ok: true };
    case "focus_camera":
      gameState.cameraDirective = mutation.directive;
      return { ok: true };
    case "reveal_poi":
      if (!gameState.revealedPOIs.includes(mutation.poiId)) {
        gameState.revealedPOIs.push(mutation.poiId);
      }
      return { ok: true };
    case "narrate":
      gameState.narrativeQueue.push(mutation.event);
      while (gameState.narrativeQueue.length > MAX_NARRATIVE_QUEUE) {
        gameState.narrativeQueue.shift();
      }
      if (!gameState.fogRevealed) gameState.fogRevealed = true;
      return { ok: true };
    case "update_entity_status": {
      if (!gameState.entities[mutation.entityId]) {
        return { ok: false, error: `Entity "${mutation.entityId}" not found.` };
      }
      gameState.entities[mutation.entityId].status = mutation.status;
      return { ok: true };
    }
    case "fog_reveal":
      gameState.fogRevealed = true;
      return { ok: true };
    default:
      return { ok: false, error: "Unknown mutation action" };
  }
}
