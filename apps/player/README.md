# @dnd-agent/player

First-person, drop-the-JSON-on-the-page player for projects authored in the [workbench](../workbench).

## What it does

1. Drop a `.dnd.json` file (exported from the workbench) onto the landing screen.
2. The file is validated against `@dnd-agent/shared/types/project-export.ts` with Zod — bad files surface friendly errors instead of crashing the runtime.
3. The preface section plays.
4. The page fades into a 300vh scroll-driven flythrough of the map; near the bottom, control hands off to a first-person camera.
5. Walk around the map. When you enter a beat's radius, that beat's dialogue fires. One-shot beats fire once.

## Controls

| Surface | Move | Look | Interact | Exit FPS |
|---|---|---|---|---|
| Desktop | `W` `A` `S` `D` | mouse drag | click ground | `Esc` |
| Touch   | virtual joystick (bottom-left) | drag the canvas | tap ground | exit button (top-right) |

The whole touch pipeline is gated behind a `(hover: none) and (pointer: coarse)` query, so iPad-with-keyboard still gets the desktop UI. Joystick + look-pad share the canvas via a `data-touch-priority` marker so taps still fall through to R3F's click-to-walk.

## Why it stays decoupled

The player imports **zero workbench code**. It only knows about the type contract in `@dnd-agent/shared` and the shared `@dnd-agent/three-engine` building blocks (props, ground, camera, movement). That means:

- The workbench can be rewritten without touching the player.
- A version-mismatched JSON fails fast with a readable error, not a runtime crash.
- The player runs offline — no backend, no API keys, nothing to break in front of judges.

## Run

```bash
pnpm dev:player        # http://localhost:3001
```

No environment variables required.

## Layout

```
app/
  page.tsx                # landing → scroll cinematic → first-person handoff
  layout.tsx              # viewport (mobile-friendly), theme color
components/
  scene/                  # R3F: map, camera, props, beat beacons, movement
  dialogue/               # in-world dialogue overlay (typed-out segments + choices)
  hud/                    # scroll hint, controls hint
  touch/                  # joystick + exit button (touch only)
  project-import-screen.tsx
lib/
  project/parse-project.ts   # zod-validated parser for the export contract
  narrative/                 # in-app dialogue runtime
  input/                     # touch input store + look hook
  three/terrain-palette.ts   # mirrors the workbench's 28 terrain ids
```
