# Artillery generations — approved set 2

All seven designs approved by Paddy on 26 November 2026: "The new designs are all good".
Approval covers Horse, Light, Field, Culverin, Royal, Heavy and Siege artillery.
These approved source designs are saved in the library; runtime integration is pending.
No runtime mappings, rules, costs, technology, saves, or live game artwork changed.

The owner rejected the first pass because it reused the same cannon shape. Both upgrade
chains must communicate substantial technological advancement at normal battle size.

The original installed game's Tactical.rsrc was read without modifying it. Resources
3233–3239 correspond to Horse, Light, Field, Culverin, Royal, Heavy and Siege artillery.
Their shapes were checked against the original manual's Military Forces illustrations.
Extracted reference images remain in ignored work/artillery-original-reference and are
not included in this review pack or a published game.

Critical original observations:
- Heavy artillery uses a raised barrel on a low mounting.
- The siege gun is visually industrial: a large circular side mechanism, stepped barrel
  and solid metal platform; it is not another traditional wooden carriage.
- The original rules already require steel for Light and Heavy artillery.
- Research era is the organizing principle; don't infer gun design from an arbitrary
  player's calendar year or claim that every upgrade has a fixed 100-year interval.

Generation: built-in image_gen, one original PNG per unit, with true alpha.
Full prompt set: prompts.json. Crop rectangles in catalog.json are preview-only.
The comparison.png and prompts.json preserve the original draft-stage record.
View artillery.html for the current approval status, both chains, actual-size previews, background comparison,
the current-game comparison toggle and separate persistent review notes.

Known limits: static concept poses only; not animation-ready atlases. Source art
contains tiny low-alpha edge pixels; judge on composited backgrounds. Claude's
review tool requested directory access and did not inspect these files, so there
is no claimed Claude approval.

Validation: seven cards and 21 canvas previews loaded without console errors or
failed requests. Tested current/new switching, note persistence, JSON export and
no horizontal overflow at 1448px, 915px and 412px. Inspected parchment, grass and
navy composites. The runtime atlas SHA256 is unchanged:
dae91e1563d46baedd2d70987de8f9d63195f6c53baed28a44e094155e2505d0.
