# Contributing

This is a pnpm + turborepo monorepo with two deployable apps and a handful of
shared packages. Work happens through v0 chats that push branches to GitHub;
Vercel watches GitHub and deploys.

## Repo layout

```
apps/
  workbench/        # DM authoring tool (terminal + map editor + story boarder)
  player/           # Player-facing runtime (3D scene + player CLI)
packages/
  dm-terminal/      # xterm-based terminal shell, AI tools, slash commands
  map-editor/       # 2D map authoring + cross-package useMapStore bridge
  narrative-editor/ # Story boarder (sections, dialogue, choices)
  player-terminal/  # Player CLI shell
  three-engine/     # Shared three.js helpers used by map viewer + player
  shared/           # Shared types (NarrativeSchema, world types, etc.)
  ui/               # shadcn/ui re-exports for both apps
```

The two apps deploy independently. Shared packages are workspace-linked, not
published to npm.

## Two v0 chats, one repo

We run two parallel v0 chats — one per app — both connected to this repo.
Each chat works on its own feature branch and opens its own PRs to `main`.

| App         | v0 chat focuses on                            | Should not touch                |
| ----------- | --------------------------------------------- | ------------------------------- |
| Workbench   | `apps/workbench/**`                           | `apps/player/**`                |
| Player      | `apps/player/**`                              | `apps/workbench/**`             |

Both chats *can* edit `packages/**`, but coordinate first. See "Shared
packages" below.

When opening a new chat, tell it explicitly which app it owns:

> You are working on the **player app** at `apps/player/`. Do not modify
> `apps/workbench/`. When editing shared packages under `packages/`, prefer
> additive changes that don't break the other app.

## Two Vercel projects, one repo

Each app has its own Vercel project, both pointed at the same GitHub repo:

| Vercel project        | Root Directory     |
| --------------------- | ------------------ |
| `dnd-agent-workbench` | `apps/workbench`   |
| `dnd-agent-player`    | `apps/player`      |

Vercel uses turborepo's dependency graph to skip rebuilds when a push doesn't
touch an app's files or its workspace dependencies. So a PR that only changes
`apps/workbench/` won't trigger a player rebuild, and vice versa. A PR that
changes `packages/shared/` rebuilds both.

To create the second project: Vercel dashboard → Add New Project → import the
same repo → set Root Directory to `apps/player`.

## Branch & PR workflow

- Each v0 chat commits to its own branch (e.g. `v0/samcareydev-9116-XXXX`).
- Don't push directly to `main`. Open a PR.
- PRs from each chat get preview URLs from *each* affected Vercel project.
- Merging to `main` triggers production deploys on whichever project is
  affected.
- Keep PRs scoped to one app where possible. Cross-app refactors (touching
  shared packages used by both) are fine but flag them in the PR description.

## Shared packages

Both apps depend on `packages/shared`, `packages/three-engine`, and
`packages/ui`. The workbench additionally consumes `dm-terminal`,
`map-editor`, and `narrative-editor`. The player consumes `player-terminal`.

Rules of thumb:

1. **Additive changes are safe.** New types, new exported helpers, new
   optional fields — these don't break the other app.
2. **Renaming or removing exports** in shared packages requires updating
   *both* apps in the same PR. Search `@dnd-agent/shared`, `@dnd-agent/ui`,
   etc. across the whole repo before deleting anything.
3. **Coordinate concurrent shared-package work.** If the workbench chat is
   actively editing `packages/dm-terminal/` and the player chat starts
   editing `packages/player-terminal/`, that's fine — different packages.
   But two chats editing the same package at the same time will produce
   merge conflicts. Land one PR before starting the other.

## Local development

```bash
pnpm install          # installs everything via the workspace
pnpm dev              # workbench dev server (default)
pnpm dev:workbench    # explicit workbench
pnpm dev:player       # player dev server
pnpm build            # turbo build across all apps + packages
pnpm lint             # turbo lint
```

Both apps run on port 3000 by default — start them in separate terminals if
you need both, and Next.js will offer to pick a different port for the second.

## Lockfile hygiene

Vercel CI installs with `--frozen-lockfile`. That means **any change to a
`package.json` `dependencies` block must be accompanied by a regenerated
`pnpm-lock.yaml`**. v0 cannot regenerate the lockfile from inside a chat — if
v0 adds a dependency, run `pnpm install` locally and commit the updated
lockfile, or undo the dependency addition.

When adding a dep that v0 detects from a new import, the auto-installer
typically handles it. Be cautious about manual edits to `package.json`.

## Conventions

- **Path aliases:** apps and packages reference each other by workspace name
  (`@dnd-agent/ui`, `@dnd-agent/shared`, etc.), never by relative path across
  the repo root.
- **UI imports:** the `@dnd-agent/ui` exports map resolves
  `@dnd-agent/ui/components/<name>` to the inner `components/ui/<name>.tsx`
  file. Do **not** double up the segment as
  `@dnd-agent/ui/components/ui/<name>` — it works in dev but fails in the
  production build.
- **Three.js:** version-pinned in the root `package.json` to keep
  `@react-three/fiber` happy. Don't bump independently in `three-engine`.
- **Sonner toasts:** import `Toaster` from `@dnd-agent/ui/components/sonner`
  (singular `components/`).

## When in doubt

- Ask the other v0 chat what it's working on before starting a shared-package
  change.
- Build locally (`pnpm build`) before pushing — turbo's per-package output
  catches type errors that single-app dev mode can miss.
- If a deploy fails on Vercel, check whether the failure is in the *other*
  project (e.g. workbench PR breaks player because a shared type changed
  shape).
