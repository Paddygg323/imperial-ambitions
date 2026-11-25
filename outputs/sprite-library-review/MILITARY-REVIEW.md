# Current army character review

Run `npm run sprites`, then open http://127.0.0.1:8790/military.html#levy .
The review starts at 01 — Levy. Next/Previous (or left/right arrow keys outside
text inputs) walks through all 30 units; the directory also supports searching.

This is the **current game artwork**, separate from the older numbered reference
sheets on the main library page. On server startup, `prepare-military.mjs` reads
`game/military-art.mjs` and the current rules, copies the exact live atlas and
ground texture, and extracts the relevant live portrait/formation CSS. Its
catalog records the version, atlas SHA-256, crop rectangles, unit names and the
actual renderer markup. Avoid editing the generated `current-military/` files.
The normal game renderer and sprite library source atlas remain authoritative.

Every unit has an enlarged preview against parchment, grass or navy, plus an
army-portrait sample and local/overview formation samples at game sizes.
Enlargement is for inspecting the source, not a promise of extra source detail.
The atlas currently supplies one painted pose per unit; combat translates or
recoils those poses. Drawn walking, loading, firing and melee animation is still
future artwork, so these previews should not be described as finished animation.

Review notes and Keep/Needs changes markers stay in this browser's local storage
under a separate sprite-review key. They do not change a campaign or publish art.
Export review notes to carry them to another browser or share them with a designer.
The exported file includes the source atlas hash. No player review notes are
committed to this repository automatically.

Checks on 25 November 2026 verified all 30 runtime mappings and their atlas hash,
navigation through every unit, search, note persistence, note export and layouts
at 1448, 412 and 915 pixels wide. No page errors, missing files or horizontal
overflow. Existing battle-effect and real campaign battle browser checks also
passed, including deployment, save/reload, retreat and return to the map.
ADB reported no connected device, so no physical Pixel check was performed.

Current artwork is presented for individual owner review, not accepted as 10/10.
