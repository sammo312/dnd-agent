# @dnd-agent/workbench

The DM authoring app. An IDE-shaped Next.js 15 surface where an Anthropic agent builds a playable RPG project alongside you, then exports it as a single JSON file the [player](../player) consumes.

## What's in the room

- **Terminal** — chat with the DM agent. Slash-commands (`/export`, `/scene`, `/whoami`) plus free-form prompts. Everything the agent does is a tool call you can watch happen.
- **Map Editor** — paintable tile grid (28 terrain types), POI library (settlements, fortifications, decoration, infrastructure), named regions, narrative beats pinned to tiles. Live 3D preview.
- **Narrative Editor** — node-graph dialogue editor. Sections (`preface` runs once on load, `beat` sections are placed on the map) → dialogue nodes → choices.
- **DM Context** — scene pitch, tone, characters, motivations. Becomes the agent's system context.

## Agent

Anthropic via Vercel AI Gateway, AI SDK 4, ~30 tools across the four surfaces. The agent and the human share the same Zustand stores — when the agent calls `terraform`, you see tiles paint in real time.

## Export

The Export button (top-right) and `/export` in the terminal both call `runProjectExport()` from `@dnd-agent/dm-terminal`, which:

1. Pulls the live state of the story / DM-context / map stores.
2. Runs `buildProject()` to produce an `ExportedProject` (`@dnd-agent/shared`, `version: 1`).
3. Validates it (preface count, beat → section refs, terminal nodes, in-bounds spawn).
4. Triggers a browser download of `<title>.dnd.json`.

Errors block the download by default; the toast offers a Force action that exports anyway.

## Run

```bash
pnpm dev:workbench    # http://localhost:3000
```

Needs `AI_GATEWAY_API_KEY` (or an Anthropic key) in `.env.local`. See the [root README](../../README.md) for the full setup.

## Layout

```
app/                      # next.js routes, /api/chat agent endpoint
components/
  workbench-layout.tsx    # dockview shell, panel registration
  export-button.tsx       # top-right export action
  panels/                 # one component per dockable panel
lib/
  agent/                  # tool definitions, system prompt
```

The heavy lifting (stores, tools, agent loop) lives in `packages/dm-terminal`, `packages/map-editor`, and `packages/narrative-editor` so the player app can re-use any piece without dragging in the workbench shell.
