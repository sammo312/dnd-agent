# Design System — The Living Stage

## Product Context
- **What this is:** An AI-directed theatrical RPG engine where the AI DM controls a 3D world in real time
- **Who it's for:** RPG players and game masters who want AI-powered tabletop experiences
- **Space/industry:** Multiplayer AI gaming, virtual tabletop
- **Project type:** Web app (two Next.js apps with 3D rendering via React Three Fiber)

## Aesthetic Direction
- **Direction:** Retro-Futuristic / Warm Terminal
- **Decoration level:** Minimal with warmth — no decorative elements, warmth comes from color temperature and subtle glow
- **Mood:** A terminal from the 80s that somehow runs a 3D game engine. Warm, functional, intentional. The UI is the computer. The computer is the DM.
- **No all-caps styling anywhere.** Labels, headers, system messages — all normal case. Never use `text-transform: uppercase`.

## Typography
- **Display/Headers:** JetBrains Mono (weight 700) — monospace as the aesthetic statement. Headers in mono say "this is a system, not a website."
- **Body:** Geist Sans — readability for longer text. The contrast between mono headers and sans body IS the design.
- **Terminal:** JetBrains Mono (weight 400/500) — the terminal IS the interface.
- **Data/Tables:** JetBrains Mono with `font-variant-numeric: tabular-nums`
- **Code:** JetBrains Mono
- **Loading:** Google Fonts CDN for JetBrains Mono. Geist via next/font (already in codebase).
- **Scale:** 12 / 14 (terminal, small labels) / 16 (body) / 18 / 20 / 24 / 32 / 48px

## Color
- **Approach:** Restrained but warm. Color is rare and meaningful.
- **All colors use OKLCH color space** (perceptually uniform, already established in codebase).

### Surfaces
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep` | `oklch(0.11 0.01 70)` | Scene background, deepest layer. Warm near-black. |
| `--bg-surface` | `oklch(0.15 0.01 70)` | Terminal background, panels, cards |
| `--bg-elevated` | `oklch(0.19 0.01 70)` | Popovers, hover states, elevated cards |
| `--border` | `oklch(0.22 0.01 70)` | Subtle warm borders, separators |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `oklch(0.88 0.03 80)` | Body text, warm off-white |
| `--text-muted` | `oklch(0.50 0.02 70)` | Secondary text, system messages |
| `--text-dim` | `oklch(0.35 0.01 70)` | Disabled, tertiary, placeholders |

### Accents
| Token | Value | Usage |
|-------|-------|-------|
| `--accent-amber` | `oklch(0.78 0.16 75)` | Primary accent. Player commands, links, CTAs, cursor. The CRT phosphor. |
| `--accent-green` | `oklch(0.70 0.17 150)` | Health, healing, success. Green-screen nod. |
| `--accent-cyan` | `oklch(0.68 0.12 195)` | Events, notifications. Cooler contrast to amber. |
| `--accent-crimson` | `oklch(0.52 0.19 25)` | Damage, errors, danger, critical HP |
| `--accent-violet` | `oklch(0.52 0.14 300)` | Mana/MP, magic effects |

### Health Bar Gradient
- Full HP: `--accent-green` (emerald)
- 50% HP: `--accent-amber` (gold)
- Critical HP (<20%): `--accent-crimson` (red)

### Terminal Message Colors
| Type | Color token | Format |
|------|-------------|--------|
| DM narration | `--text-primary` | Regular weight, full-width |
| Player commands | `--accent-amber` | Prefixed with "> ", with glow |
| System messages | `--text-muted` | Italic ("the dungeon master considers...") |
| Event notifications | `--accent-cyan` | With glow |
| Errors | `--accent-crimson` | Prefixed with warning icon |

### CRT Glow Effect
Accent-colored text gets a subtle matching text-shadow for the phosphor feel:
- Amber glow: `text-shadow: 0 0 8px oklch(0.78 0.16 75 / 0.30)`
- Green glow: `text-shadow: 0 0 8px oklch(0.70 0.17 150 / 0.30)`
- Cyan glow: `text-shadow: 0 0 8px oklch(0.68 0.12 195 / 0.25)`

Apply glow to: accent-colored text, cursor, health bars (via box-shadow), primary buttons.
Never apply glow to: body text, muted text, borders, backgrounds.

### Dark Mode
This is a dark-only product. No light mode. The warm near-black backgrounds ARE the design.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable for workbench panels, compact for terminal
- **Scale:** 2(2xs) 4(xs) 8(sm) 12(md) 16(lg) 24(xl) 32(2xl) 48(3xl)

## Layout
- **Approach:** Hybrid — workbench is grid-disciplined (dockable panels, IDE-like), player is composition-first (3D scene + terminal drawer)
- **Grid:** Workbench uses Dockview for panel management. Player uses react-resizable-panels for the scene/terminal split.
- **Max content width:** Full viewport (both apps are full-screen)
- **Border radius:**
  - sm: 2px (barely rounded, almost sharp)
  - md: 4px (subtle, for buttons and inputs)
  - lg: 8px (only for major containers in workbench)
  - full: 9999px (pills, avatars only)
  - Terminal: 0px — sharp corners always. Terminals don't have rounded corners.

## Motion
- **Approach:** Intentional — every animation serves the experience
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms) long(400-700ms)
- **Specific animations (from /plan-design-review):**
  - Fog reveal: 3s easeInQuad (slow start, accelerating finish)
  - Entity spawn: 0.5s easeOutBack (bounce overshoot, "placed on stage")
  - Entity despawn: 0.5s fade-out
  - Terminal expand/collapse: 0.3s ease-out
  - Message fade-in: 0.15s ease-out

## Entity Display (drei Html overlays)
- **Name labels:** JetBrains Mono, 11-12px, weight 500, normal case. Background: `oklch(0.11 0.01 70 / 0.85)` with no border-radius. Padding: 2px 6px.
- **Health bars:** 3-4px height, no border-radius. Colors follow the health bar gradient (green -> amber -> crimson). Glowing box-shadow on bars above 50%.
- **Positioning:** Centered above entity, name label above health bar.

## Terminal Design
- **Background:** `oklch(0.11 0.01 70 / 0.90)` — 90% opacity so the 3D scene bleeds through slightly. Pair with `backdrop-filter: blur(8px)`.
- **Layout:** Two-column. Scrollable stats sidebar left (190px), narration feed right, command input full-width bottom.
- **Header bar:** Optional. Background `oklch(0.09 0.01 70)`, with colored dots (red/amber/green) and title text.
- **Input:** Amber `>` prompt with glow, blinking amber cursor. Placeholder: "what do you do?"
- **Borders:** 1px solid `--border`. Sharp corners.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-25 | Initial design system created | Created by /design-consultation. Retro-futuristic direction chosen. |
| 2026-04-25 | No all-caps | User preference. All text in normal case. |
| 2026-04-25 | Amber replaces cyan as primary accent | Amber is the CRT phosphor color. Cyan becomes secondary for events. |
| 2026-04-25 | JetBrains Mono for display/terminal | Monospace as aesthetic statement. "This is a system, not a website." |
| 2026-04-25 | Sharp corners (0-2px radius) | Retro terminal aesthetic. Rounded corners break the vibe. |
| 2026-04-25 | Subtle CRT glow on accent text | 30% opacity text-shadow gives phosphor warmth without being garish. |
| 2026-04-25 | Full terminal ASCII art mode | Braille-dot art at every state: scene headers, entity portraits, combat banners, loading. |

## ASCII / Braille Art System
- **Direction:** Full terminal art mode — braille-dot art is a core design element, not decoration.
- **Rendering:** Unicode braille characters (U+2800 block), rendered in JetBrains Mono with accent color glow.
- **Scene headers:** Braille art illustration when entering a new location (tavern, dungeon, forest). Centered in the narration feed, framed by `· · ·` or `━━━` dividers. Art uses `--accent-amber` with glow.
- **Entity portraits:** Player character portrait in the stats sidebar (always visible). NPC/monster portraits appear inline in the narration feed when examined, displayed next to their description text.
- **Combat banners:** Braille art (crossed swords, shield, skull) in a border box with `--accent-crimson` when combat initiates.
- **Loading state:** Sword braille art + "awaiting the dungeon master..." in the narration feed before first DM message.
- **Color rules:** Scene art = amber glow. Entity portraits = match entity's accent color (amber for player, cyan for NPCs). Combat art = crimson. Loading art = amber.
- **Size:** Scene headers ~15-20 lines tall, entity portraits ~10 lines, combat banners ~8-10 lines. All must fit within the narration feed width.
- **No all-caps in art labels.** Scene names, entity names, combat text — all normal case.
