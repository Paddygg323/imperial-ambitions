# Tile silhouette repairs — runtime 257

23 November 2026. This change addresses the owner's report that tree tiles still
cut off after the earlier containment adjustment.

## Cause and changes

- The hardwood source put some outer foliage against its presentation hex; a
  mask could not recover that missing silhouette. Hardwood and scrub now have
  complete transparent silhouettes in the existing palette and pixel-art style.
  Alpha bounds are measured once on load, preserving aspect ratio and fitting
  the complete feature inside the tile. Trees use the continuous world grass.
- The broad terrain fade also erased outer parts of cattle, cotton, sugar cane,
  tobacco and other resource illustrations. These now use a narrow source-rim
  mask with separate handling for gold-framed sheets. Grain and horse profiles
  were audited in the same pass. Source originals are retained.
- Ground and coastline clipping now ends before objects are drawn, so coastal
  towns and development structures are not sliced by the shoreline mask.
- No resource quantities, ownership, discovery, orders or campaign rules changed.

## Verification

- Eleven focused unit tests passed, including silhouette fitting, source pixel
  preservation, masks, ownership visibility and town appearance.
- `sprite-edges-browser.mjs verified` loaded all 51 mappings and checked 49
  land/resource mappings at scales 26, 35, 78 and 110: 196 checks. No opaque
  artwork pixels were lost to the tile boundary. Maximum fractional alpha loss
  was 0.137% at the smallest scale; the test allows 0.2% for edge antialiasing.
- Asset checks validated all 51 runtime mappings and 121 library entries.
- `borders-sprites-browser.mjs complete-silhouettes` rendered local, maximum
  forest zoom, nation, world and 412-pixel phone views with no page errors,
  horizontal phone overflow or change to the fixture game state.
- Contact sheets under `verified/` show every mapping at enlarged and playing
  scale. The matching in-game captures are under
  `../borders-sprites/complete-silhouettes/`; the previous forest view is under
  `../borders-sprites/colour-band/forest-close.png`.

Generated forest assets and exact built-in image-generation prompts are in
`outputs/sprite-library-review/revisions/2026-11-23-complete-forests/`.
Original sheets and the prior manifest entries are preserved there or under
`originals/`. The current map audit does not certify the wider art overhaul or a
store-ready release. No physical Pixel installation was requested in this pass.
