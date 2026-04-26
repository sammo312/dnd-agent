export { PlayerTerminalShell } from "./components/player-terminal-shell";
export { playerTools } from "./lib/ai/tools";
export { buildPlayerSystemPrompt } from "./lib/ai/system-prompt";
export { routePlayerCommand } from "./lib/game/command-router";
// The character sheet lives as a server-side module-level singleton
// inside the character-builder tool. Re-export the getter so the
// player app can serve it from a tiny GET endpoint and a visual
// drawer can mirror what the AI is mutating.
export { getCharacterSheet } from "./lib/ai/tools/character-builder";
