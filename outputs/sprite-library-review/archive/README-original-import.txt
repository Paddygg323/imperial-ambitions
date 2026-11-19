SPRITE LIBRARY — REVIEW ONLY

Open index.html to browse the reference set. It works locally without a server.
For the chat browser preview, run `node serve.cjs` in this directory and open
http://127.0.0.1:8770/ . The helper listens only on this computer.

Source: https://chatgpt.com/s/m_6afc4d27d1f081919eddec91d085ab49
Imported: 18 November 2026

97 numbered sprites (001–097) and 2 standalone alternatives from all 10 images.
Use the printed sprite ID when requesting changes, for example “003 hills” or
“061 explorer”. The two unnumbered standalone pictures are indexed as 042-alt
(horse artillery) and 024-alt (pikeman), with the sheet versions kept alongside.
These descriptive associations do not replace either original.

Original PNGs are stored unchanged in originals/. SHA256SUMS.txt records hashes.
manifest.json records each sheet, source, ID, caption and display rectangle.
The viewer isolates entries with SVG viewports; it does not repaint, resize,
remove backgrounds from or otherwise rewrite the original image files.
These remain reference art, with the supplied hex bases and parchment backgrounds.
Production cutouts, animation, tiling and game integration are intentionally deferred.

The game source, deployed site, Android build, original PC game and saves are
outside this library. No library assets have been installed into them.

Review notes and “needs change” / “keep as supplied” marks are optional and stay
in this browser's local storage. “Export review notes” downloads a JSON file.
Approving an entry in this viewer does not publish or install it into the game.
The viewer also works without storage access; export notes before closing then.

Keep originals immutable. Future edited artwork should go in a new revisions/
folder, with separate filenames and revision metadata, after the user specifies
the desired edits. Do not overwrite references or apply the library to the game
until the user authorizes integration.

Validation completed:
- All 10 copied originals matched their downloaded SHA-256 hashes.
- All 97 numbered entries exist once, plus 2 distinct alternatives.
- All 99 display rectangles stay inside their source image dimensions.
- JavaScript syntax checks passed.
- Browser review confirmed search, category filtering, enlarged views and
  switching between the horse artillery sheet and standalone alternative.
- No browser console errors were reported in that review.
- library-preview.jpg records the final gallery view.
