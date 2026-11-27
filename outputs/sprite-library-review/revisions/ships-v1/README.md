# Ships — painted set 1

Twelve static designs created with built-in `image_gen`, 27 November 2026.
Awaiting owner review. **Library only: no game code, runtime assets, statistics,
missions, save data or public game deployment changed.**

Open `../../ships.html` through the library server (`node
outputs/sprite-library-review/serve.cjs`, localhost port 8790). The main library
also includes twelve new variants alongside the unchanged original ship sheet.

The set uses the approved horse-artillery painting as a material/style reference
and the first Carrack draft as a common rendering anchor. Each class has its own
hull/rig/machinery brief. These are new paintings, not extracted original-game
artwork. The generation brief is in `prompts.json`; Carrack's initial wording and
single-reference exception are recorded there. `catalog.json` lists files,
dimensions, display crops and SHA-256 hashes.

Review features: four ship families, large previews, 73/50/35px complete-ship
width samples, sea/parchment/dark backgrounds, greyscale, silhouettes, hidden
names and per-ship notes. Width samples normalise the designs for readability;
they are not final comparative fleet sizes. Relative `scale` values in the
catalog are proposals for later review, not applied to the game.

PNG alpha is preserved from image generation. Crops are canvas display metadata,
not destructive edits. Original generator outputs remain unchanged. The viewer
adds safe display padding around all silhouettes. Runtime waterline placement,
directional poses, flags and animations remain separate work.

Notes are local to this browser origin under `imperial-ambitions-ships-v1` and can
be exported to JSON. They are not automatically sent back to the repository.
The older main-library reviewer has its own notes; use the dedicated ship page
for this round of feedback.
