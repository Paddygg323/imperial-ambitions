# Imperial Ambitions development backlog

Updated 23 November 2026. This is the shared work list for Paddy, Codex and the
designer. Items 1–10 are Paddy's requested work; items 11–20 are additional
suggestions for review. Keep the numbering stable so feedback can reference an
item. Record implementation and verification evidence before marking work done.

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
3. [ ] **Contextual side-panel buttons.** Show the actual orders available to the
   selected unit. Explain unavailable orders and their requirements; keep the
   currently selected unit and its order obvious.
4. [ ] **Improved civilian animations.** Give each role recognisable, appropriate
   work and idle animations: explorer surveying with a looking glass, builder
   hammering and engineer working on plans. Keep the established period style.
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

## Additional suggestions for review

11. [ ] **End-turn review.** One compact, actionable summary of idle research,
    units awaiting orders, food shortages and production problems. Tap a warning
    to reach the relevant screen; deliberately sleeping units should not nag.
12. [ ] **Supply-network overlay.** Show which resources reach the home economy,
    their road/port routes, actual deliveries and the point where a route is
    disconnected or capacity is exhausted.
13. [ ] **Next-turn economy forecast.** Show expected food, workforce support,
    labour use, manufacturing and stock changes after current orders. Clearly
    distinguish confirmed domestic output from uncertain trade purchases.
14. [ ] **Resource and development overlay.** Make known deposits, undeveloped
    resources, current development levels and eligible improvements easy to find
    across a whole nation. Never reveal undiscovered resources.
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

Review the additional suggestions before scheduling them. Build the tutorial
against the settled interfaces so its guidance does not immediately become
outdated; test it with someone new to the game.

## Accepted design decisions

- **Province borders:** Paddy selected **option 5, Colour band**, on 23 November
  2026. Use the controlling nation's colour for a crisp line with a dark keyline
  and a broader translucent band. National frontiers keep each country's colour
  on its respective side. This is separate from the open items above.

## Completion record

For each completed item, add its commit or pull request, screenshots where
relevant, the checks performed and any remaining limitations. A visual preview,
passing unit test or historical approval flag alone does not close a task that
still requires gameplay or device verification.
