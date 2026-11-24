# Landscape and combat presentation, 0.2.65

The direction remains painted historical miniatures, quiet ground, navy enamel,
warm gold and readable vellum. This pass changes presentation only. Turn timing,
combat resolution, terrain costs, resource rules, AI decisions and save formats
are unchanged.

## Artwork and rendering

- Shared matte grass and restrained slate-blue water replace conspicuous
  repeating surface patterns. Existing approved resource silhouettes are kept;
  runtime colour grading and grassy-edge feathering bring their bases together.
- Town lighting no longer flips on alternating tiles. Gold, silver, gems and
  diamonds have distinct resource artwork instead of sharing a generic ore icon.
- Five civilians now have six painted work poses each, with measured foot
  anchors, stable scale and different working rhythms. See CIVILIAN-WORK-ART.md.
- Battle cover uses six painted vegetation/rock subjects with deterministic
  placement. Fort levels, gates, towers, damage and breaches use painted parts
  selected from actual battle state. Unit grounding and cloth pennants clarify
  the miniature formations; health and morale remain readable at phone size.
- Movement, recoil, impact and loss feedback follows committed battle commands.
  Effects never queue a command, delay AI resolution, alter RNG or write saves.
  Reduced motion skips them; effect nodes are cleaned up after playback.
- Wide battle layouts put the command cabinet beside the field. Phone controls
  remain below it. Army and navy rows are compact, illustrated and selectable.
- Research paintings retain their full colour. Unknown portions of the single
  diplomacy atlas get restrained compass/rhumb decoration, without revealing land.
- Startup keeps the application hidden until the map images, civilian sheets,
  reviewed sprites and fonts are decoded and the map has drawn. Failed loads
  retain an actionable retry screen without replacing a saved campaign.

Generated raster files are in `game/assets/landscape/` and
`game/assets/civilians/`. Prompts and review evidence are preserved in
`outputs/visual-review/landscape-combat265/`. Atlas coordinates are explicitly
defined in the corresponding renderer; do not change dimensions without updating
the renderer and checking actual screenshots. Runtime colour adjustments do not
replace the approved sprite-library source assets.

## Validation and independent review

970 unit tests passed. Browser checks cover 60 desktop/phone/landscape/narrow
screens, six work poses for every civilian, actual work orders and cancellation,
hidden/covered map pause, reduced motion, research funding/goal/reload, continuous
diplomacy-map gestures, battle deployment/movement/damage/breaches/results/reload,
and loading with a deliberately held or failed image request. Presentation tests
compare saved state before and after UI-only interactions and animation playback.

Three read-only Claude reviews drove revisions to cover repetition, fort artwork,
formation grounding, roster density, resource consistency and research colour.
The final review found no release blockers. Its two minor notes about flat
faction markers and regiment selection boxes prompted cloth pennants and enamel
selection seals. These were checked again in the real rendered screens.

This is evidence for this release, not a claim that subjective appearance is
perfect or the game is store-ready. Owner art acceptance, physical Pixel comfort,
idle civilian animation and complete campaign/device validation remain open.

Design critique used **Unslop by Damir Sokolovsky (@heydamir), CC BY 4.0**:
https://github.com/heydamir/unslop .
