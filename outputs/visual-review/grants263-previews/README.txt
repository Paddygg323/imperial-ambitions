Diplomacy grants: three review prototypes
A Treasury cabinet: commands beside the atlas
B Envoy's atlas: map first, compact commands beneath
C Royal dispatch: compact command scroll above the atlas

Interactive local preview: http://127.0.0.1:8794/?design=c
Only synthetic in-memory campaign data is used. No player save is read or written.
These layouts are not shipped to the public game. Production code is unchanged.
Use the design buttons to compare layouts; amount choices, recurring switch, nation selection, relation disclosure and map scrolling are interactive. Other diplomacy tabs are intentionally disabled in this grants-only study.

Validated at 1448x1080, 412x915 and 360x800: no horizontal overflow or runtime errors; all four amount choices mutually exclusive; recurring defaults Off and works by keyboard; all six shields visible without overlap when expanded; country selection and map Home/End navigation; browser storage remains empty.

Design sources: user's established navy/gold/parchment references; Claude's revised composition briefs following rejection of its initial rendered prototypes. Implemented and verified by Codex.
Craft review informed by Unslop by Damir Sokolovsky (@heydamir), CC BY 4.0: https://github.com/heydamir/unslop/tree/main/skills/unslop
Explicit user art direction takes precedence over its generic dashboard styling defaults.

To reopen these prototypes from the repository root:
node outputs/visual-review/grants263-previews/source/server.mjs
Then open http://127.0.0.1:8794/?design=b
The server exposes only the preview source and game runtime, not the repository root.

Final Claude review: B8/10, A7/10, C7/10. No blockers to showing all three as design alternatives. These ratings assess the prototypes, not store readiness or gameplay completeness.
