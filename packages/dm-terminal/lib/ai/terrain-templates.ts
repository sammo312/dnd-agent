/**
 * Terrain templates — reference archetypes the executor and planner
 * pattern-match against when building a map. Each template is a
 * concrete paint-by-numbers plan: container dimensions, a base-fill
 * (often "negative space" like deep-water that lets a non-rectangular
 * landform read as a non-rectangular MAP), then a stack of paintTerrain
 * layers, plus typical scenery and spawn hints.
 *
 * Two reasons this lives in its own module:
 *   1. Single source of truth — the system prompt (executor's guidance)
 *      and the planner prompt (designer's brief format) both inject the
 *      same string. Drift between them was producing inconsistent map
 *      style.
 *   2. The format is tight enough to read like a recipe card. Agents
 *      reliably copy the structure (base → elevation → water → texture
 *      → scenery → spawn) when given concrete tile coordinates.
 *
 * Coordinates in each template are written for a 50×40 reference grid
 * but the layouts scale — the agent should adapt proportionally to
 * whatever dimensions the scene actually wants.
 */

export const TERRAIN_TEMPLATES_PROMPT = `## Map shape — the container is rectangular, the LANDFORM doesn't have to be

setMapDimensions creates a rectangular container, but the playable shape inside can be ANY silhouette. The trick is to flood-fill the container with "negative space" terrain first — water for an island, lava for a volcanic plain, deep-water for a peninsula, swamp for a fenland, sand for a desert oasis — and then paint the actual landform on top using small overlapping rectangles. The negative-space fill hides the rectangular border; the landform reads organically.

Always start with the negative-space layer when the map shape isn't a simple rectangle. Without it, every map ends up looking like a square because the unpainted base is grass everywhere.

## Templates — pick one as a starting point, adapt freely

### ISLAND  (irregular landmass surrounded by sea)
- Dimensions: 45×35 to 55×40, slightly wider than tall.
- Layer 1 (base): paintTerrain deep-water across the FULL container — this is the negative space.
- Layer 2 (landmass): paintTerrain grass with 4-6 SMALL overlapping rectangles forming an irregular blob in the center. e.g. (12,8)→(35,28), (18,5)→(30,10), (8,15)→(15,25), (35,20)→(42,30). The overlaps create organic edges; never one big rectangle.
- Layer 3 (beaches): paintTerrain sand in 2-3 thin rectangles along the landmass edges where it meets water — NW beach, S beach, etc.
- Layer 4 (interior elevation): paintTerrain rock (+1) or mountain (+2) in a 2-3 rectangle cluster forming a hill in the middle of the landmass.
- Layer 5 (texture): paintTerrain forest in 2-4 small patches scattered across the landmass.
- Scenery: trees clustered around the hill base; flower-beds near a beach; banner on the highest ground.
- Spawn: a sand tile on the closest beach (player washes ashore).

### VOLCANO  (cone with summit caldera, lava field around)
- Dimensions: 40×40 (the only template that genuinely wants square — a volcano is radial).
- Layer 1 (base): paintTerrain lava across the FULL container — the volcanic plain.
- Layer 2 (foothills): paintTerrain rock (+1) in a rough ring of 4-5 rectangles forming the lower slopes around the center, e.g. (10,10)→(30,30) carved by smaller lava patches.
- Layer 3 (cone): paintTerrain mountain (+2) in 2-3 rectangles forming the upper cone in the middle, e.g. (16,16)→(24,24).
- Layer 4 (caldera): paintTerrain lava in a tiny rectangle dead center, e.g. (19,19)→(21,21) — looks like glowing crater from above.
- Layer 5 (cooled flows): paintTerrain dirt or sand in 2-3 thin rectangles snaking from the cone outward toward the edges.
- Scenery: torches in pairs on the approach path; a banner near the caldera; rock outcrops on the slopes (no trees — nothing grows here).
- Spawn: a dirt tile at the foot of the cone (player approaches from the cooled-flow path).

### FOREST  (deep woods, narrow path winding through)
- Dimensions: 30×55 (tall and narrow — forests feel deep, not wide).
- Layer 1 (base): paintTerrain forest across the FULL container.
- Layer 2 (clearings): paintTerrain grass in 3-4 small irregular rectangles scattered down the length, e.g. (8,5)→(15,9), (18,22)→(24,28), (10,40)→(16,45).
- Layer 3 (path): paintTerrain dirt-road as a series of 4-6 short rectangles snaking through the clearings — dogleg the path so it doesn't run straight.
- Layer 4 (water): paintTerrain water in a thin meandering stream running off one edge into a clearing.
- Layer 5 (rock outcrops): paintTerrain rock in 1-2 small clumps near the deepest parts.
- Scenery: trees densely clustered along the path edges; flower-beds in clearings; torches at trailheads; fence-wood marking a hunter's clearing.
- Spawn: a dirt-road tile at the entry edge (player walking IN to the woods).

### COASTLINE  (curving shore between sea and inland)
- Dimensions: 55×30 (wide and short — emphasizes horizon).
- Layer 1 (sea): paintTerrain deep-water in the lower 30-40% of the map.
- Layer 2 (shallows): paintTerrain water in a thin band where deep-water meets land.
- Layer 3 (beach): paintTerrain sand as a curving band along the water's edge, with at least one bay (a notch where sand pushes inland).
- Layer 4 (grassland): paintTerrain grass filling the upper portion above the beach.
- Layer 5 (inland features): paintTerrain rock or forest in 2-3 patches further from shore.
- Scenery: torches on a pier or dock approach; banners on a clifftop; trees clustered in the inland forest patches; fence-stone marking a coastal estate.
- Spawn: a sand tile on the beach.

### MOUNTAIN PASS  (narrow channel between two ridges)
- Dimensions: 25×55 (tall and pinched — the corridor IS the scene).
- Layer 1 (base): paintTerrain rock across the FULL container.
- Layer 2 (left ridge): paintTerrain mountain (+2) along the LEFT edge in 3-4 vertical rectangles with varying widths so the inner edge is jagged.
- Layer 3 (right ridge): same on the RIGHT edge — irregular.
- Layer 4 (pass floor): paintTerrain dirt or gravel down the center where the player walks.
- Layer 5 (snow caps): paintTerrain snow on the highest ridge points (small rectangles at the top of mountain blocks).
- Scenery: torches in pairs along the pass at intervals; rock outcrops in the floor; banner at a midway watchpost; no flora.
- Spawn: a dirt tile at the south end of the pass.

### RIVER VALLEY  (wide grassland split by a snaking river)
- Dimensions: 55×35 (wide).
- Layer 1 (base): paintTerrain grass across the FULL container.
- Layer 2 (river): paintTerrain water as 4-6 short overlapping rectangles snaking from one short edge to the other, bending at LEAST twice. e.g. (0,18)→(15,20), (12,15)→(28,17), (25,18)→(40,21), (38,16)→(55,18).
- Layer 3 (riverbank): paintTerrain dirt or sand in thin rectangles on both sides of the river.
- Layer 4 (hills): paintTerrain rock in 2-3 rectangles on one side of the valley to break up the flat plain.
- Layer 5 (forest): paintTerrain forest in 2-3 patches on the side OPPOSITE the hills.
- Scenery: trees thickening the forest edge; flower-beds in the meadow near the river; fence-wood lining a farm; torches near a bridge POI.
- Spawn: a grass tile on one bank near a crossing.

### DESERT RUINS  (windblown sand, broken stone islands of civilization)
- Dimensions: 50×40.
- Layer 1 (base): paintTerrain desert (or sand) across the FULL container.
- Layer 2 (dunes): paintTerrain sand in 4-5 irregular patches creating tonal variation.
- Layer 3 (oasis): paintTerrain water as a tiny pond + grass ring around it, somewhere off-center.
- Layer 4 (ruin platforms): paintTerrain stone-floor or cobblestone in 3-4 small rectangles representing crumbled foundations scattered across the map.
- Layer 5 (rock): paintTerrain rock in 1-2 small outcrops near the ruins.
- Scenery: flower-beds at the oasis; torches at the largest ruin; banner half-buried in sand; fence-stone fragments around a ruin.
- Spawn: a sand tile at the map edge facing the largest ruin platform.

### FROZEN TUNDRA  (snow plain with ice features)
- Dimensions: 50×35.
- Layer 1 (base): paintTerrain snow across the FULL container.
- Layer 2 (ice patches): paintTerrain ice in 3-4 patches representing frozen lakes or glaciers.
- Layer 3 (rocky outcrops): paintTerrain rock in 2-3 clumps where the snow blew off ridges.
- Layer 4 (drifts): paintTerrain tundra in irregular bands suggesting where the snow is thinner.
- Layer 5 (a single dark feature): paintTerrain forest (a stand of pines) OR mountain (a peak) somewhere on the map for contrast.
- Scenery: torches in pairs marking a path across the ice; fence-wood around a hunter's blind; banners on a frozen camp; trees only in the dark feature patch.
- Spawn: a snow tile at the map edge.

## How to use a template

Pick whichever fits the scene's vibe. Adapt freely — change the dimensions to fit, swap in a different elevation feature, recolor scenery to match the theme. The templates are starting recipes, not laws. The goal is that NO map ever ends up as a flat grass square with one blob of forest in the middle.`;
