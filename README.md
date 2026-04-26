# dnd-agent

**An AI dungeon master that builds the world, then lets you walk around in it.**

The DM sits in a workbench and uses agent tools to author a map, characters, and a branching story — terraforming terrain, dropping POIs, wiring narrative beats to map tiles. Hit **Export**, drop the JSON into the player app, and you spawn into a first-person 3D rendering of what the agent just made. Walk near a beat, the dialogue fires.

> Submission for Vercel's [Zero to Agent](https://community.vercel.com/hackathons/zero-to-agent/showcase) hackathon.

---

## The two apps

**Workbench** (`apps/workbench`) — IDE-style authoring environment for the DM. Dockable panels for an agent terminal, a tile-based map editor, a node-graph narrative editor, and a live 3D preview. The agent talks back through the terminal; everything it does is a tool call against the same stores the human is looking at.

**Player** (`apps/player`) — Drop the workbench's `project.dnd.json` onto the page, scroll to fly into the map, then click or use WASD / virtual joystick to walk. Beats trigger when you walk into them.

The wire format is one JSON envelope (`@dnd-agent/shared/types/project-export.ts`, `version: 1`). Workbench writes it, player validates it with Zod, and a version mismatch fails loudly — so the two halves never silently drift.

## What's interesting about it

- **Real agent, real authoring.** The DM is an Anthropic agent with ~30 tools (terraform a region, place POIs, create characters, build a dialogue tree, attach a beat to a map tile, validate the project, export). The "session" is the document the agent edits.
- **One contract, two apps.** Workbench and player share zero runtime code — only the type contract in `@dnd-agent/shared`. Either side can be rewritten without touching the other.
- **First-person, scroll-driven entry.** The player landing zooms from a top-down map flyover into a first-person camera as you scroll, then hands you the controls. Touch-friendly: virtual joystick + drag-to-look on phones.
- **Procedural fallbacks for everything.** Maps are 28 terrain types + a POI library; the player picks a procedural prop (tree, rock, bush, building) when the export doesn't ship a GLTF, so the DM never has to source assets.

## Run it locally

```bash
pnpm install
cp .env.example .env.local        # add your AI Gateway / Anthropic key
pnpm dev                           # workbench at :3000
pnpm dev:player                    # player at :3001
```

The workbench needs an AI key. The player runs offline — it only reads the JSON you drop on it.

## Repo layout

```
apps/
  workbench/        # next.js — DM authoring app
  player/           # next.js — first-person player app
packages/
  shared/           # the project-export contract (the only thing both apps agree on)
  dm-terminal/      # agent loop, tools, terminal UI
  map-editor/       # tile/POI/region/beat editor + zustand store
  narrative-editor/ # node-graph dialogue editor + zustand store
  three-engine/     # shared R3F building blocks (props, camera, ground, movement)
  ui/               # shadcn/radix design system
```

## Tech

Next.js 15 · React 19 · Three.js / React Three Fiber · Zustand · Dockview · AI SDK · Anthropic via Vercel AI Gateway · Zod · Tailwind v4 · Turborepo / pnpm workspaces.

---

## Demo

- **Live:** _password-protected — see submission notes_
- **Walkthrough video:** _Loom link in submission_

If the live AI features stop working, the hackathon credit pool ran out — the rest of the player still works on any pre-exported `.dnd.json` you drop on it.
