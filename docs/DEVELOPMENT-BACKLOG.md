# Imperial Ambitions development backlog

Updated 24 November 2026. This is the shared work list for Paddy, Codex and the
designer. Items 1–10 are Paddy's original requests. Items 11–20 now record his
review of the additional suggestions: 11 and 14 have specific replacement briefs,
12 and the original 13 are rejected, 13 now records the requested end-turn
simplification, and 15–20 are approved. Keep the numbering stable. Approval is
not completion; record implementation and verification evidence before marking
work done.

The existing game, saves and original gameplay relationships remain the starting
point. Audit existing functionality before replacing it. A task below may be an
improvement to something already present, rather than a wholly missing feature.

## Requested work

1. [ ] **Full combat graphical design.** Establish a coherent battlefield style
   for terrain, regiments, formations, fortifications, attacks, damage and victory
   or defeat. Units and effects must remain readable at phone scale.
2. [ ] **Army and navy orders view overhaul.** Make selecting units, inspecting
   their situation, issuing orders and reviewing or cancelling orders clear and
   consistent with the original game's direct interaction.
   The 26 November naval art audit found that the map and fleet/shipbuilding
   portraits reuse one generic ship despite twelve library concepts. The
   role/silhouette brief and integration acceptance checks are in
   `VISUAL_DESIGN.md`. Audit only; new ship artwork and runtime integration remain
   outstanding. This does not complete the orders-view work.
3. [ ] **Contextual side-panel buttons.** Show the actual orders available to the
   selected unit. Explain unavailable orders and their requirements; keep the
   currently selected unit and its order obvious.
4. [ ] **Improved civilian animations.** Give each role recognisable, appropriate
   work and idle animations: explorer surveying with a looking glass, builder
   hammering and engineer working on plans. Keep the established period style.
   Version 0.2.65 supplies six painted productive-work poses per role, including
   merchant and spy; shared map/cabinet rendering, fixed foot anchors, per-role
   timing, cancellation and reduced-motion behavior are verified. Waiting and
   ordinary movement still use standing art; idle animation and physical Pixel
   comfort remain separate work. See CIVILIAN-WORK-ART.md and the evidence below.
5. [ ] **Confirm nonproductive civilian movement.** Ask for confirmation when a
   click would move a civilian rather than issue a productive order. State the
   action and destination clearly; cancelling must preserve the civilian's
   position and previous orders. Do not add confirmation to routine productive
   work.
6. [ ] **Remove zoom lag.** Profile pinch, wheel, zoom buttons and panning with
   realistic map and unit loads. Keep the map responsive through continuous
   zooming on the Pixel and browser, including transitions to strategic views.
7. [ ] **Overhaul every menu using the perfected diplomacy theme.** Finish and
   review diplomacy first, then apply its parchment, frames, typography, buttons,
   icons and interaction conventions to the other menus. Diplomacy's primary
   action remains choosing a treaty and then its recipient on the map.
   Version 0.2.59 introduces a diplomacy-only shared theme for review: parchment
   and enamel materials, treaty seals, a map with a separate nation dossier,
   responsive phone layout and a wrapping nation directory. Power rankings and
   the separate favoured-partners tab were removed from diplomacy at Paddy's
   direction. Partner details remain in the nation dossier. See
   `MENU-DESIGN.md` and `outputs/visual-review/diplomacy259`. Owner visual review
   and conversion of the other menus are still outstanding.
   Version 0.2.60 follows Paddy's correction: one continuous, scrollable world
   map replaces the Europe/New World/World buttons. Dragging is kept separate
   from treaty selection. Evidence: `outputs/visual-review/diplomacy260`.
   Version 0.2.61 adds all major-power shields to the relation scale, clearer
   subsidy artwork, an off/on recurring-grant switch and illustrated major
   exports in Information, following Paddy's review. Evidence:
   `outputs/visual-review/diplomacy261`. Version 0.2.62 removes the rejected
   horizontal flag clustering, reduces marker size and replaces the subsidy
   percentage boxes with illustrated coin choices. Evidence:
   `outputs/visual-review/diplomacy262`. Version 0.2.63 applies a shared visual
   layer across the main menus, following the owner's broader Unslop request.
   Owner acceptance and further research-screen art polish remain open. See the
   completion record below.
8. [ ] **Images for trade and industry.** Provide consistent illustrations for
   resources, manufactured goods and production processes, alongside readable
   amounts, inputs, outputs and labour requirements.
9. [ ] **Correct ocean discovery and appearance.** A previously unknown ocean is
   revealed only when a ship ends a turn adjacent to it. Revealing it must reveal
   the whole sea region. Once discovered, render it like an Old World sea with no
   faded treatment. Check order placement, cancellation, end-turn resolution and
   save/load so none reveals an ocean prematurely.
10. [ ] **Skippable guided starting tutorial.** Guide players through the tasks
    and menus they actually use each turn: civilians, development, transport,
    food and workers, industry, research, trade, diplomacy, armies and fleets.
    Use short prompts attached to real actions, progressing when the action is
    completed. Explain one thing at a time and omit filler text. Skip must be
    available throughout; allow the tutorial to be restarted from Help.

## Reviewed additions and corrections

11. [ ] **Audit the existing warnings against the original rules.** Some
    warnings already work; inspect them before changing them. The researchers
    are idle warning belongs at the start of a turn after research was idle for
    the previous turn. It is not a new pre-emptive end-turn warning. The food
    warning appears only when the player can ship more food in AND will hit zero
    food if they do not. Test both conditions independently and together. Do not
    introduce the proposed generic end-turn review or expand the economic report.
12. **Rejected: supply-network overlay.** Do not add the proposed economic
    overlay as part of this work. Paddy wants less economic reporting, not more.
13. [ ] **Simplify the existing end-turn screen.** The proposed next-turn
    economy forecast is rejected. Remove the excessive economy breakdown already
    on the end-turn screen instead of adding forecasts or further summaries.
    Preserve necessary trading decisions, turn resolution and the specific
    warnings in item 11. Keep detailed economy information in its relevant menu.
14. [ ] **Builder resource finder in the bottom-right panel.** When a builder
    is selected, fill the available bottom-right space with images of resource
    types they can improve. Beside each image, show the number of eligible tiles
    of that type in the player's kingdom. Clicking an image centres on an
    improvable tile of that type; repeated clicks cycle through the other
    eligible tiles. Keep the builder selected and do not issue an order merely
    by browsing. Counts must reflect current improvement eligibility and update
    as it changes. Never expose undiscovered resources. This replaces the
    proposed general resource/development overlay.
15. [ ] **Unified order feedback on the map.** Give civilians, armies and fleets
    consistent selection highlights, legal destination previews, planned routes
    and completion estimates. Make selecting and rescinding a pending order
    straightforward; do not change what orders the rules permit.
16. [ ] **Save slots and recovery.** Audit and strengthen manual saves,
    pre-turn recovery snapshots and save export/import. Show nation, year and
    timestamp clearly; ensure a failed load or update cannot replace a good save.
17. [ ] **Useful battle reports.** Explain casualties, damaged or lost units,
    retreats, captured territory and the principal reasons for the outcome.
    Link reports to the location and surviving army or fleet.
18. [ ] **Consistent sound feedback.** Add restrained period-appropriate sounds
    for selection, accepted/rejected orders, completed work and combat, with
    separate music/effects controls and a clear mute option.
19. [ ] **Accessibility and phone comfort.** Check text scaling, touch targets,
    contrast, optional symbols alongside nation colours, and reduced motion.
    Verify portrait and landscape layouts without losing important actions.
20. [ ] **Complete campaign and device validation.** Play through to verified
    victory and defeat, including late-game performance, AI competition,
    overseas supply disruption, interrupted turns and save/load. Verify offline
    play, Android background/resume and longer sessions on the Pixel.

## Suggested sequence

First address accidental movement, zoom responsiveness and ocean discovery
(5, 6, 9). Establish diplomacy as the agreed menu reference (7), then carry the
theme into orders, contextual controls, trade and industry (2, 3, 8). Develop
combat art and civilian animation in parallel with those interface improvements
where the designer's work is independent (1, 4).

Items 11–20 have been reviewed: use the corrected scope above and do not revive
the rejected reports. Implement the builder finder (14) alongside the contextual
side panel (3), and warning corrections/end-turn simplification (11, 13) together.
Build the tutorial against the settled interfaces so its guidance does not
immediately become outdated; test it with someone new to the game.

## Accepted design decisions

- **Information belongs where the player acts.** Prefer contextual controls and
  useful visual information over extra end-turn economy reporting. On 23 November
  Paddy rejected the supply overlay and forecast, specified the warning rules
  and builder finder above, and approved suggestions 15–20.
- **Province borders:** Paddy selected **option 5, Colour band**, on 23 November
  2026. Use the controlling nation's colour for a crisp line with a dark keyline
  and a broader translucent band. National frontiers keep each country's colour
  on its respective side. This is separate from the open items above.

## Completion record

For each completed item, add its commit or pull request, screenshots where
relevant, the checks performed and any remaining limitations. A visual preview,
passing unit test or historical approval flag alone does not close a task that
still requires gameplay or device verification.

- **0.2.63 — broad visual pass, partial progress on 1, 2, 7, 8 and 19.** Shared
  navy/vellum controls, spacing, typography and selected states; illustrated
  trade and grants; corrected atlas clipping; compact research vacancies;
  illustrated army/navy rosters; quieter map surfaces; painted battle cover,
  clearer formations and connected fortifications. Phone minimap/control overlap
  and landscape battle height corrected. Save data and rules are unchanged.
  Evidence and limitations: `outputs/visual-review/visual-craft263/verification.txt`.
  Browser interaction tests cover research, production, transport, trade,
  diplomacy, fleet selection, map-only mode and tactical combat. These items
  remain open: new battle effects/animation, broader order-view work, owner art
  review, physical Pixel comfort and complete campaign/device validation are
  not completed by this presentation pass. Claude's independent visual review
  improved from 6.5 to 7/10; this is not an app-store-ready claim.

- **0.2.64 — research folio, civilian productive-work cycles and diplomacy B.**
  Owner-selected B now uses a continuous atlas above the command strip. Research
  has a journal/catalogue composition, phone page switch, illustrated subjects,
  country knowledge shields and restrained controls. Five roles have painted
  work cycles; explorer/merchant/spy were redrawn after Claude's critical review.
  Its final verdict cleared this scoped visual update with minor pose-spacing
  notes, while explicitly excluding motion cadence and whole-game readiness.
  Research orders/funding/reload, diplomatic orders/refunds, native map swipes,
  animation/cancel/reduced motion and unchanged save bytes were checked in
  isolated browsers. The complete 967-test gameplay suite passed.
  Evidence: outputs/visual-review/scholar-council264/verification.txt.
  Minor review notes: explorer's last pose can read as raising/lowering in
  isolation; merchant's two writing poses remain the closest pair. Neither was
  identified as a publishing blocker. Owner review and physical-device checks
  remain open; these changes do not mark the full backlog complete.

- **0.2.65 — landscape, six-pose civilian work and battlefield refinement.**
  Partial progress on 1, 2, 4, 7, 8 and 19: shared ground/water materials,
  resource-base blending, distinct precious resources, consistent town lighting,
  six work poses per role, painted cover and forts, movement/shot feedback,
  cloth faction pennants, compact rosters, colour research art and continuous
  atlas decoration. Startup now waits for a fully drawn map instead of showing
  staged asset loading. Three Claude review rounds found no remaining publishing
  blockers; owner acceptance is still required before calling the art finished.
  970 unit tests, 60 screen captures, work-order/reduced-motion/cancellation,
  research/diplomacy controls, real campaign battle save/load and deliberately
  delayed/failed startup checks passed. Evidence and limits:
  `outputs/visual-review/landscape-combat265/verification.txt` and
  `docs/LANDSCAPE-COMBAT-ART.md`. Physical Pixel testing, civilian idle animations
  and the other open gameplay/device items are not completed by this pass.
