# Diplomacy menu foundation

23 November 2026 · version 0.2.62 · candidate for Paddy's visual review.

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
actual relationships. Small 14-by-17px shields remain centred on the exact value,
with no horizontal grouping or clamping. Collisions use vertical rows only,
including exact ties; stems share the same scale. Country names and qualitative
relationships are available as accessible labels/tooltips; raw scores stay hidden.

Trade subsidies use individual clickable enamel medallions instead of rectangular
percentage boxes. Increasing coin stacks distinguish the five subsidy amounts;
normal trade uses scales and boycott a crossed purse. Percentages remain readable
below the images, and the selected choice has a bright rim and underlined caption.
Grants have a labelled recurring switch: Off sends once, On sends every
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

Version 0.2.62 corrects the owner-rejected horizontal marker clusters and the
subsidy controls themselves. Browser checks now compare each shield centre to
its exact relation position, including endpoints, ties and nearby values, and
exercise the seven illustrated policy choices. Evidence is in
`outputs/visual-review/diplomacy262`. Gameplay and save data are unchanged.

## Shared visual pass — 0.2.63

At Paddy's request, the Unslop audit now covers the map, cabinet, every main menu
and land battles. `game/visual-craft.css` is the final shared presentation layer.
The direction is ceremonial but readable: navy enamel instruments, warm vellum
ledgers, brass framing at screen boundaries and painted subjects. Gold identifies
the principal action; nested rows no longer compete with the outer frame.

Manufacturing, transport, research and trade share properly clipped commodity
art. Trade cards and market offers are illustrated; their existing handlers and
order rules are unchanged. Research uses effect-specific illustrations and three
compact empty project seats. Army/fleet selection has explicit pressed states,
larger portraits and a consistent roster. Grants use distinct purse/chest choices.
The map retains the owner's terrain, towns and borders, with quieter water and
ground texture. Battles use painted cover, larger local formations, connected
fort walls and an overview that omits overlapping detail labels.

Evidence: `outputs/visual-review/visual-craft263/verification.txt`. The new
`game/test/visual-craft-browser.mjs` checks all main screens at four sizes and
unchanged save bytes; `trade-visual-browser.mjs` exercises the redesigned trade
controls with a real minor-country offer. Set `PLAYWRIGHT_MODULE_PATH` and
`CHROME_BIN` if using tools outside the project's normal dependencies.

Claude reviewed two passes, scoring the final reviewed pass 7/10, with remaining
research-surface polish. This is a published development improvement, not owner
acceptance of all artwork or app-store certification. Pixel validation and the
full animation/art backlog remain separate work.

Design workflow adapted from **Unslop by Damir Sokolovsky (@heydamir)**,
https://github.com/heydamir/unslop, licensed CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/). The period palette, serif type,
painted assets and intentional ornament follow this game's brief.

## Research folio, civilian work and diplomacy B — 0.2.64

Paddy chose diplomacy B: a broad continuous world atlas above the command strip,
with the selected nation's dossier alongside the diplomatic instruments. The
tools remain visible during scrolling; Information uses the broad report area
for exports, trade terms, alliances and wars. Grants retain the clear default-off
recurring switch. Phone atlas height is 320px so countries remain large enough
to target and the map remains meaningfully scrollable.

Research is now a bound folio: goals, active projects and funding on the left;
illustrated technologies on the right. Phone players switch between Projects
and Technologies without scrolling past a large vacant workbench. Category
icons, status tabs and search have distinct visual hierarchy. Foreign knowledge
uses heraldic country shields with the existing country-details interaction.
Funding, goals, prerequisites, project limits and save data are unchanged.

Civilian productive work uses four painted poses per role, shared between the
map and cabinet. Hammering, drafting, telescope surveying, bookkeeping and
surveillance have separate timing and aligned feet. Idle/waiting units remain
still. Reduced motion holds a complete pose; covered/hidden maps stop painting.
See CIVILIAN-WORK-ART.md for provenance, prompts and the rendering contract.

Claude's iterative review found the initial pose differences too subtle; three
roles were redrawn. Its final scoped verdict was clear to ship, with two minor
pose-spacing observations. Still-image review does not verify motion cadence.
Functional browser tests cover actual work orders, cancellation, reduced motion,
map pause/resume, research orders/funding/reload and diplomacy/map controls.
Evidence: outputs/visual-review/scholar-council264/verification.txt.
This closes this visual pass, not the entire artwork backlog or store readiness.

## 0.2.65 refinement

Army and navy rosters use compact illustrated rows and enamel selection seals.
Wide battle views gain a command cabinet beside the field; phones keep reachable
controls below it. Research artwork retains its painted colour. The continuous
diplomacy atlas uses quiet compass decoration in unknown water without revealing
land. A full loading screen remains until the map is actually ready, including
image decoding and fonts, with a safe retry state on failure.

See LANDSCAPE-COMBAT-ART.md and outputs/visual-review/landscape-combat265 for the
three Claude review rounds, artwork provenance, screenshots and test evidence.
