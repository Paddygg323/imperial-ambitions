# Naval visual direction

Updated 27 November 2026. Scope: ship-library audit and artwork review. No gameplay
or runtime artwork is changed by this document. The existing menu, terrain and
civilian design documents remain authoritative for their respective areas.

## 1. Direction

Concept-derived tags: **painted naval miniatures**, **readable technological
progression**, **wood, canvas and iron**.

Visual phrase: period strategy miniatures whose hull, rig and machinery identify
their role before the player reads their name. Match the accepted painted unit
style, with a consistent elevated three-quarter camera and upper-left lighting.
Avoid photographic textures, oversized gold trim and decorative sail emblems.

## 2. Verified audit

- The library contains twelve ship concepts in
  `outputs/sprite-library-review/originals/04-ships.png` (IDs 049–060).
- The live map currently calls the same `sprite(10, ...)` for every fleet in
  `game/map.mjs`. Fleet cards, recruitment, naval research and the selected-fleet
  cabinet use the same `.ship-portrait` atlas image. Therefore the twelve library
  concepts are not twelve distinct ship designs in the running game.
- Map ship widths are approximately 35px minimum, 49px at scale 52 and 73px at
  scale 78. At strategic scale below 20 the map deliberately uses nation dots.
- Carrack/Galleon and Indiaman/Ship-of-the-Line are the weakest library pairs.
  Flags and painted sails carry too much of their distinction. Frigate and
  Trader also need stronger role-specific profiles at small scale.
- Sloop, Clipper and the steam silhouettes are more recognisable, but all
  concepts need consistent perspective, faction-neutral construction and
  transparent export rather than their baked blue water hexagons.

Evidence: read-only original manual, PDF pages 24–25 (printed pages 43–46),
the repository's `SHIPS` table and current renderer. The original manual groups
ships into battle, fast-war, bulk-merchant and fast/general-merchant roles.
Its later ships still include sailing rigs; do not invent modern battleships.
No claim is made that the current library passes small-size recognition testing.

The existing concepts were also rendered at 120, 73, 50 and 35px reference-tile
widths. The baked water takes some of that space, so these are not exact final
hull-footprint tests. Several sailing silhouettes collapse into similar canvas
clusters at the smaller sizes. Evidence:
`outputs/sprite-library-review/revisions/ship-audit/existing-ships-scales.png`.
Original artwork is unchanged; final transparent ships still need the full
acceptance checks below.

## 3. Twelve distinct identities

These are design targets, not approved replacement artwork. The twelve drafts
now live in `outputs/sprite-library-review/revisions/ships-v1`, with a dedicated
`ships.html` review page. Every design awaits owner review. Families describe
roles and successive technology, not a new in-place upgrade mechanic.

| Family | Ship | Structural identity required |
| --- | --- | --- |
| Fast/general merchant | Carrack | Short, deep, rounded hull; conspicuously high fore and aft castles; unequal sail heights. Broad and old-fashioned, not a stretched Galleon. |
| Fast/general merchant | Trader | Medium-length workhorse; lower castles, restrained rig and a visible open cargo working area. Neither the tiny Sloop nor the tall Clipper. |
| Fast/general merchant | Clipper | Exceptionally long, slender hull, sharp projecting bow and tall layered canvas. Low hull under a tall rig makes speed legible. |
| Bulk merchant | Fluyte | Pear-shaped, broad-bellied hull, narrow upper deck and rounded high stern. Cargo volume is the main shape; few visible gun ports. |
| Bulk merchant | Indiaman | Large, full-bodied cargo hull with substantial deckhouses and visible cargo hatches. A merchant's working deck, not continuous stacked gun batteries. |
| Bulk merchant | Merchant Steamship | Broad, long cargo hull with conspicuous paddle machinery, funnel, cargo hatches and auxiliary rig. More deck volume and less weaponry than Raider. |
| Fast warship | Sloop | Small low hull, one dominant mast and a strong triangular-sail silhouette; scant superstructure. |
| Fast warship | Frigate | Long, lean hull with a single clear gun-deck band, low stern and three-masted rig. Much lower and slimmer than Ship-of-the-Line. |
| Fast warship | Raider | Lean steam warship with a prominent funnel and readable propulsion machinery, minimal cargo superstructure and sparse auxiliary canvas. Original unlock is Paddlewheels; confirm the original colour sprite before choosing the final mechanism. |
| Battle | Galleon | Long beaked bow, tall stepped stern and a substantial early gun battery. The long hull and stern steps must separate it from round, short Carrack. |
| Battle | Ship-of-the-Line | Broad, tall-sided hull with multiple stacked gun-deck bands and a heavy three-masted rig. Its gun decks, rather than cargo buildings, dominate. |
| Battle | Ironclad | Broad armoured steam warship, dark iron sides, clear battery and funnel. Preserve period auxiliary masts/rig where supported by the original; no invented twentieth-century turrets. Distinguish through armour and hull mass, not a grey repaint. |

## 4. Palette and shared construction

Five material roles: dark brown for hull/rig outlines; warm oak for wooden hull
volume; ivory for canvas; cool iron-grey for machinery/armour; pale sea-green for
restrained wake highlights. Nation colour is a separate flag/selection overlay,
not baked into the ship's permanent sails or hull. It must not determine class.

Use the same camera, light direction, waterline anchor and scale convention.
Retain meaningful size differences: a Sloop must not be enlarged to the bulk of
a Ship-of-the-Line just to fill its card. Preserve safe padding around spars,
bowsprits and flags. Avoid tiny rigging that disappears or flickers on a phone.

## 5. Asset handoff and eventual integration

Painted assets: type-specific hull, rig, guns and machinery. Transparent exports
contain no sea tile, typography, nation crest or selection border. Procedural
layers: nation flag, existing selection/order indicators, count and restrained
wake. Maintain one waterline pivot and stable bounds across future animation.

After artwork review, replace the shared icon through one type-to-asset mapping
used by map, fleet list, shipbuilding, research and selected-unit cabinet. Mixed
fleet representation needs a documented deterministic display rule; counts and
selection must remain accurate. Keep the existing strategic dot representation.
Do not change movement, cargo, mission rules, costs, combat, discovery or saves.

## 6. Acceptance checks before integration

1. Review twelve named large designs first, in the four role families.
2. Then hide labels/flags and compare at 35, 50 and 73px ship footprints, plus
   70–96px menu portraits. Ask whether role and class can be identified in two
   seconds; do not declare this passed from a large contact sheet.
3. Specifically pair Carrack/Galleon, Trader/Frigate, Fluyte/Indiaman,
   Indiaman/Ship-of-the-Line, Clipper/Frigate and Merchant Steamship/Raider.
4. Repeat silhouette-only and greyscale comparisons. If differentiation depends
   on colour or a tiny emblem, change structure rather than adding decoration.
5. Inspect against the actual ocean at local and national zoom and on a phone
   layout, including selected/unselected and mixed-fleet states. Check no crop,
   anchor jump, unreadable hit target or baked water rectangle.
6. Owner approval of concepts is separate from animation, runtime integration
   and gameplay-regression verification. Those steps remain outstanding for
   ships. The review page provides the small-size, greyscale and silhouette
   comparisons; its availability is not a passed blind-recognition test.

## 7. AI-Generated Look Suppression Rules

### 7.1 Visual Hierarchy Rules
- Protagonist: the selected fleet's readable hull and rig.
- Threat: an enemy fleet's recognisable warship structure and ownership marker,
  shown only when the existing visibility rules permit it.
- Reward: a clearly reached destination and retained cargo/mission state, using
  existing game feedback rather than invented celebration effects.
- 2-second recognition check: identify class without the name or national flag;
  pending until replacement art exists and is tested at actual size.

### 7.2 Limits on Familiar Template Symbols
- Adopted familiar elements (max 2): national pennant and existing selection ring.
- Replaced unique element: the universal sailing-ship icon, replaced eventually
  by a coherent vocabulary of twelve hull/rig/machinery silhouettes.

### 7.3 UI-Independent Feedback
| Event | Non-UI visual response | Intensity (Low/Med/High) |
| :---- | :--------------------- | :----------------------- |
| Selection | Existing selection outline around the actual ship footprint | Med |
| Sailing order | Existing destination/route feedback; identity retained | Med |
| Idle at home | Calm waterline, no exaggerated sailing or combat motion | Low |

These are presentation constraints on existing events, not authorisation to
change order behaviour or introduce new effects in this audit.

### 7.4 Composition and Gaze Guidance
- Initial focal point: hull/rig silhouette, then nation marker, then fleet count.
- Visual flow: ship, selected destination, contextual orders.
- Anti-center-clutter implementation: no ornamental water hex, oversize smoke
  plume or repeated sail crest; keep sea names and neighbouring fleets readable.
