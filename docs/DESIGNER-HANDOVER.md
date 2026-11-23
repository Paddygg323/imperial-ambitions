# Designer handover

## The actual brief

Read [the current development backlog](DEVELOPMENT-BACKLOG.md) alongside this
handover. It records the owner's ten priorities, his decisions on the ten
additional suggestions, and the selected province-border style. The builder's
resource finder belongs in the contextual panel; extra economic overlays and
forecasts were rejected in favour of a simpler end-turn screen.

The owner wants a professional graphical overhaul, especially a coherent sprite library. The current game still looks poor to them. Do not polish individual sprites in isolation and assume the map is solved: judge complete landscapes at actual playing scale.

The primary direction is [this navy-and-gold strategy-game mock-up](design-references/main-style.png): rich but legible period UI, readable painted pixel-art terrain and resources, ornate frames, a minimap and contextual unit panel. [This diplomacy reference](design-references/diplomacy-direction.png) illustrates the parchment treatment. Original-game screenshots in this folder are references for composition and clarity, not assets to copy into production.

Keep the overhead viewpoint useful for road planning. Ground should remain quiet enough for resource symbols, civilians, armies, towns and roads to read clearly.

## Start with these files

1. Run the game and inspect the local, nation and world views on desktop and a narrow phone viewport.
2. Run the sprite library and browse the complete numbered source set. The immutable reference sheets are in `originals/`; iterations and generation prompts are in `revisions/`; previous selections are preserved in `archive/`.
3. Read [live-sprite-map.json](live-sprite-map.json). It maps the runtime's hashed PNG names back to library source files by content hash.
4. Inspect `game/reviewed-sprites.mjs`, `game/reviewed-sprite-data.mjs` and `game/map.mjs`. They explain masking, compositing, scale and layering.
5. Use the [runtime 254 comparison](../outputs/visual-review/sprites254/terrain-sheep.png) and [in-game screenshot](../outputs/visual-review/sprites254/local.png) as a baseline, not an approved final design.

## Explicit owner decisions to retain

- All terrain should blend into the same grass at its edges. Normal hills and sheep hills must use identical underlying hills, with sheep added on top.
- Keep empty plains simple. Flowerless grass is the common case; flower variants appear sparsely in coherent patches.
- Hills remain green to the top. Mountains use a slightly more overhead view. Swamp is boggy green with short tufts; desert is flatter and yellow.
- Resource symbols must be obvious at playing scale. Tin is light silver, iron darker grey, copper reddish, coal black. Deposits are not hidden in scenery or placed in carts.
- Grain fields are large rectangular patches contained within the tile, with no cut-off field edges and no baked roads or trees. Preserve their grass colour across development.
- Grain development: level 1 has one red-roof building, level 2 has two close together on the field, level 3 has two buildings plus a period plough, level 4 has one larger building plus the plough. The plough sits on the grain; no tractor.
- Spices are low bushes with substantial coverage, not trees. Cotton should read as cotton and development should be visible without replacing the ground.
- Tin mine levels 1–4 use 1–4 substantial partially overlapping piles with simple mine markers. Keep level progression legible.
- Towns are small or large; within England, London alone starts large. Avoid circular-looking towns. Fort levels are visually distinct; higher forts should be taller.
- Armies on the strategic map use a small selectable camp/tent, not a large soldier standing on a tile. Battle units need coherent period art.
- Civilian activity should be role-specific: explorer looking through a glass, builder hammering, engineer working on plans.
- Ships belong at sea or adjacent to their port, not on land. Selection/orders must remain readable.

## Recommended first milestone

Produce one coherent sample landscape covering plains, hills, sheep hills, mountains, swamp/tin, grain levels and a town/road junction. Show it at local action scale, nation scale and on a phone. Agree that direction with the owner before repainting the entire library.

Then carry the same palette, lighting direction, perspective, pixel density, shadow treatment and scale through terrain, development, roads, towns, civilian units, ships and battle units. Preserve differentiation instead of making every resource a recoloured generic blob.

## Deliverables and integration

- Keep editable layered originals for newly authored work, plus transparent PNG exports.
- Use stable semantic names and retain the existing numbered library IDs as references.
- Separate ground, resources, development and units wherever practical. Do not bake roads, selection rings, labels, hex borders or UI frames into map sprites.
- Include an export manifest: source file, exported image, dimensions, trim rectangle, pivot/anchor, intended size and animation frames where relevant.
- Supply a contact sheet and screenshots from the real game, not only enlarged standalone sprites.
- Keep revisions separate; do not destroy rejected artwork or source references.
- Update runtime mappings, sprite-library previews and offline-cache entries together when integrating.

The owner has not accepted the complete appearance. The desired result is a consistent game scene, not just individually attractive illustrations. Gameplay changes require a separate discussion.
