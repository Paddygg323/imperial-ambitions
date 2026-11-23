# Diplomacy menu foundation

23 November 2026 · version 0.2.59 · candidate for Paddy's visual review.

Diplomacy is the first menu using the shared materials in `game/menu-theme.css`.
The other menus have not yet been converted. This is not an overall art approval
or a store-readiness claim. Backlog item 7 remains open.

## Visual language

- Deep navy brocade surrounds warm, lightly textured parchment. Gold frames and
  circular seals provide hierarchy without obscuring the information.
- Georgia headings and body text use dark brown ink. Selected actions use navy
  enamel; selected section tabs use gold. Keyboard focus remains clearly visible.
- Shared classes are `menu-theme`, `menu-paper`, `menu-enamel-tabs`, `menu-seal`
  and `menu-kicker`. Material, ink and rule colours are CSS custom properties.
- Reuse the existing vellum, brocade and frame artwork. Do not bake labels,
  numerical values or controls into images.

## Diplomacy behaviour

Choose a treaty, then its recipient on the map. The treaty costs, availability,
orders, AI responses and save data are unchanged. Country buttons are an
alternative to selecting small countries on the map.

The four sections are Treaties, Trade subsidies, Grants and Information. At
Paddy's request, diplomacy has no Power rankings button or separate favoured
partners tab. A minor nation's favoured partner is shown in its own dossier.
Relationships use a bar and a qualitative description, not a precise power score.

Europe opens first; World and New World remain available. Region clipping keeps
off-map labels and territory outside the selected atlas view. Country names draw
above territory fills. Political and relationship views share the same controls.

On desktop the selected nation's dossier sits beside the atlas. On a narrow
phone it follows the treaty map, and precedes the map in Information mode. The
treaty picker folds after choosing an action, bringing the map into view. It can
be reopened to choose another action. A wrapping country directory replaces the
clipped horizontal strip. Buttons and pending-order markers keep 44px targets.

## Validation and review

`game/test/diplomacy-menu-browser.mjs` checks treaty selection before recipient,
offer cancellation, consulate refund, pact, grant reservation/reload/refund,
subsidies, favoured partners, keyboard country selection and layouts at 360, 412,
915 and 1448 pixels. The old diplomacy244 entry point invokes this regression.

`game/test/diplomacy-saved-campaign-browser.mjs` accepts a private fixture through
`DIPLOMACY_SAVE_FIXTURE`; viewing the updated screen must leave that save
byte-identical. A read-only copy of England 1538 passed. The private fixture is
not included in the repository or publication.

Screenshots and release-check notes are in `outputs/visual-review/diplomacy259`.
Claude's first review identified the country strip, duplicate minor shield and
World-first view; each was corrected before publication. Broader menu conversion
should follow Paddy's review of this screen.
