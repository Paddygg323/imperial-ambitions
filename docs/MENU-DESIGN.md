# Diplomacy menu foundation

23 November 2026 · version 0.2.61 · candidate for Paddy's visual review.

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
The relation bar shows all six major-power shields against the selected nation's
actual relationships. Exact ties form a compact group; nearby distinct values
use separate rows with stems to the scale. Country names and qualitative
relationships are available as accessible labels/tooltips; raw scores stay hidden.

Trade subsidies use a gold merchant-scales and coin illustration in the tab and
the page. Grants have a labelled recurring switch: Off sends once, On sends every
turn until cancelled. Entering Grants defaults to Off. Toggling only edits the
draft; selecting a recipient sends it, with the existing refund/rescind rules.

Information shows up to four major exports with commodity images. Minor nations
use connected production or remaining current-market supply. Great Powers use
actual sale offers capped by stock, commitments and cargo; if none are available,
last turn's completed exports may be shown with that explicit label. Warehouses
and undeveloped deposits alone are not treated as export supply. Viewing these
figures never invokes AI planning or consumes random draws.

Paddy requested one continuous world map instead of region tabs. Europe and the
New World now share a single atlas. Narrow screens scroll horizontally by touch,
mouse drag, wheel or keyboard; wider screens can show both continents together.
There are no Europe/New World/World navigation buttons. Political and relationship
views share the same map and retain its scroll position. Selecting a nation in
the directory brings it into view. Unexplored territory stays hidden.

Dragging must never dispatch a treaty. The viewport handles scrolling separately
from country taps and campaign data. Country names draw above territory fills;
the atlas is bounded and does not wrap.

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

The subsequent owner-directed continuous-map change is covered by
`game/test/diplomacy-pan-browser.mjs`: native browser touch swipes, mouse dragging
with an alliance armed, wheel/keyboard navigation, position retention, hidden and
surveyed land, country centring and unchanged save bytes. Screenshots and notes
are in `outputs/visual-review/diplomacy260`. No physical Pixel check was performed
for this change.

Version 0.2.61 adds `game/test/diplomacy-info.test.mjs` for relation and export
provenance, hidden overseas nations and read-only state. The menu browser test
also covers both grant modes, switch keyboard use, default-off behaviour, six
nonoverlapping shields (tied and varied values), export images and subsidy art.
Review evidence is in `outputs/visual-review/diplomacy261`.
