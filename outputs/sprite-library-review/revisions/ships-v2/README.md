# Ship refinements and main-map artwork

27 November 2026, game version 0.2.66. Requested by Paddy:

- Fluyte: longer, lower cargo deck, rounded high stern and modest sails so it
  does not share the Carrack's squat two-castle silhouette.
- Galleon: broad cream sails, substantial sterncastle and long broadside, with
  fewer gun decks and a smaller overall footprint than the Ship-of-the-Line.
- Main map: all twelve classes use the matching painted designs. No simulation
  rules, orders, costs, discovery, ownership or saved ship data changed.

`catalog.json` points to these two revised images and ten preserved version-one
images. `prompts.json` records the generation briefs and references. These are
original generated assets, not copied original-game sprites. They remain open
for owner review. The previous images and review entries remain available.

`scripts/pack-ships.py` packages the current index for Canvas2D, retaining source
hashes, bounds and pivots. The exported PNG is straight-alpha, padded and unrotated;
the browser uses high-quality linear filtering. No source art is modified.

The map uses the selected class in mixed fleets, otherwise the highest native
firepower, hull size, then original list order. This does not change the fleet.
Local portraits are proportional; distant strategic dots remain unchanged.

Evidence: `checks.json`, `comparison.png`, and
`outputs/visual-review/ships266/`. Owner review is distinct from technical checks.
Ship menus and animations are outside this integration.
