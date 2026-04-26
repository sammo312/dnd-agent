# TODOS

## Design Debt (from /plan-design-review 2026-04-25)

### 1. Create DESIGN.md via /design-consultation
- **What:** Run /design-consultation to create a formal design system.
- **Why:** 3 design decisions are blocked: entity label styling, health bar colors/sizing, terminal background opacity. Without a DESIGN.md, engineers will pick colors ad-hoc.
- **Depends on:** Nothing. Do this before Day 1 of the sprint.
- **Blocked by:** Nothing.

### 2. Implement theatrical interaction states
- **What:** Build the terminal states specified in the Design Decisions section of the plan: "Awaiting the Dungeon Master..." (initial load), "The stage dims... reconnecting" (disconnect), "The Dungeon Master considers..." (command feedback), fog-returns-on-disconnect.
- **Why:** These states are the theatrical moments that differentiate this from a generic game engine. Without them, the player sees blank screens and "Loading..." text.
- **Depends on:** Terminal two-column layout (Day 3), fog reveal (Day 3).
- **Blocked by:** Nothing once terminal layout exists.

### 3. Accessibility baseline: keyboard nav + contrast
- **What:** Implement keyboard shortcuts (backtick toggles terminal, Tab focuses command input, Escape returns focus to 3D scene). Check all dim text meets 4.5:1 contrast ratio against #1a1a2e terminal background.
- **Why:** Terminal-based game needs keyboard nav. Dim text ("DM considers...") must be readable.
- **Depends on:** Terminal component exists.
- **Blocked by:** Nothing.

## Deferred Features (from /plan-ceo-review 2026-04-25)

### 4. Demo autoplay mode
- **What:** Scripted sequence for expo/video recording.
- **Why:** Live typing is more impressive for the demo, but autoplay is useful for recordings and booth demos.

### 5. Curtain call intro sequence
- **What:** ASCII art title + opening narration + 3D fade-in.
- **Why:** Nice atmospheric touch but core demo doesn't need it.

### 6. sceneManagerTool state migration to sync server
- **What:** Move scene manager state to the sync server instead of local.
- **Why:** Needed for production multi-client, not needed for localhost demo.
