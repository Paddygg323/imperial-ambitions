# Selected province borders: colour band

23 November 2026, runtime 256. Paddy selected option 5 from the five border
previews. Province boundaries now use their controlling nation's colour with a
dark keyline and wider translucent band. National frontiers retain both nations'
colours on their respective sides. Gameplay and ownership rules are unchanged.

The screenshots in this directory were captured from the actual game in an
isolated browser using `node game/test/borders-sprites-browser.mjs colour-band`.
Local, nation, world and 412-pixel phone views were inspected. The browser check
reported unchanged fixture state, no JavaScript errors and no horizontal phone
overflow. No player campaign was used.

Focused validation passed: seven tests across `map-borders.test.mjs`,
`cartography.test.mjs` and `coastline.test.mjs`. `npm run check:assets` validated
51 runtime sprite mappings and 121 library references. The main publication
workflow runs the complete test suite and deployment checks before publication.

Previous appearance: the parent `borders-sprites/` review captures the former
pale province boundaries. This acceptance is for the selected border style only;
the wider visual overhaul remains open in `docs/DEVELOPMENT-BACKLOG.md`.
