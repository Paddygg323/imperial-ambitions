# Architecture and artwork

The browser client is buildless JavaScript ES modules. `game/index.html` loads `boot.js` and `app.mjs`; `engine.mjs` coordinates the game systems. Game rules live in separate modules for economy, research, trade, diplomacy, armies, navy and AI. Canvas rendering is primarily in `map.mjs`; interfaces use HTML/CSS plus canvas/SVG views.

## Main visual entry points

| Area | Files |
| --- | --- |
| World map and draw order | `game/map.mjs` |
| Reviewed terrain/resource sprites | `game/reviewed-sprites.mjs`, `game/reviewed-sprite-data.mjs` |
| Ground, coasts and roads | `landscape-art.mjs`, `landscape-detail.mjs`, `coastline.mjs` |
| Towns and forts | `map-art249.mjs`, `assets/towns-forts.png` |
| Civilians, fleet markers and camps | `map-markers.mjs`, `map-orders.mjs` |
| Battlefield rendering | `battle-map.mjs`, `battle-view.mjs`, `military-art.mjs` |
| UI theme and panels | `style.css`, `royal.css`, `royal-ui.mjs` |
| Diplomacy and research | `diplomacy-screen.mjs`, `research-screen.mjs`, associated art modules |
| Offline cache | `game/sw.js` |

Paths in the table without `game/` are relative to that folder.

## Runtime 254 sprite pipeline

The source library contains full images and contact sheets, including presentation borders. `reviewed-sprite-data.mjs` selects source regions. `prepareReviewedSprite` isolates their terrain content and feathers land edges into the continuous `grass-surface` texture. It is a runtime presentation transformation; original PNGs are preserved.

Terrain is drawn first, then rivers/roads, resources, development markers, towns, labels and units. Sheep use the normal hill terrain key and a separate transparent overlay. Mineral overlays are selected only from resources already visible to the player. Do not accidentally reveal hidden deposits.

Important: some runtime mappings remain loaded only for historical compatibility or review. For example, `012` is the older sheep-tile artwork; active sheep ground now uses `003-r1` plus `sheep-overlay`. `019` is the old full tin tile; undeveloped tin now uses swamp plus `ore-tin`. Read selection code, not just the image list.

Other legacy atlases still supply towns, units, interface portraits and development artwork. They are included, but their style has not been made consistent with the new terrain.

## Integration procedure

1. Add a versioned library revision and editable source.
2. Export to `game/assets/` and update the consuming manifest/art module.
3. Keep ground/resource visibility, tile positions and unit orders unchanged.
4. Add new production files to `sw.js` and advance its cache version.
5. Run unit tests, asset checks and a browser smoke check; inspect multiple zooms.
6. Build Android if needed. Record evidence and limitations in a new release note.

Do not run the historical `work/` scripts as a batch: many are one-off migrations against specific old source text or local files.
