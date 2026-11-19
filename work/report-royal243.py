from pathlib import Path
import hashlib, json

ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'outputs'
apk=json.loads((out/'Standalone-Android-build.json').read_text())
bundle=json.loads((out/'Android-bundle-validation.json').read_text())
audit=json.loads((out/'Royal-243-module-audit.json').read_text())
assert bundle['versionCode']==243
generated=Path('C:/Users/paddy/.codex/generated_images/01a0ee53-00af-7d32-a4f5-ff2543979bbf')
assets={
 'royal-ocean.png':('exec-c3c0fb7d-70a8-4050-9d49-1ed1f4a7eeb2.png','Seamless square, top-down painted royal cobalt ocean, small irregular turquoise and pale-blue wave crests with restrained ivory highlights. Jewel-like late-1990s illustrated strategy art, no land, ships, grid, horizon, text or vignette. Uniform light and medium-small evenly distributed detail. Opaque background. Final bitmap used unchanged at world-anchored scale; coastline geometry, labels, navigation and fog rules unchanged.'),
 'royal-regiments.png':('exec-e5228c3b-4bee-4e25-8111-c9f341b24286.png','Thirty original historical regiment miniatures, six columns and five rows, transparent background; painterly cutouts matching the navy/gold presentation. Exact unit order is MILITARY_TYPES in military-art.mjs. Requested clear margins and uniform cells; final integration uses measured per-subject rectangles because the generated alignment is imperfect.'),
 'royal-meadow.png':('exec-e29f2d1e-fe3c-4435-a8da-c6c9a977a982.png','Quiet overhead olive meadow and ochre ground with painterly variation, no objects, text, grid or built-in scenery. Used as a subtle campaign overlay and once across the battlefield; not assumed to be a seamless repeating texture.')
}
inventory=json.loads((out/'visual-review/Royal-art-provenance.json').read_text())
for name,(original,brief) in assets.items():
 asset=ROOT/'game/assets'/name
 digest=hashlib.sha256(asset.read_bytes()).hexdigest()
 assert digest==hashlib.sha256((generated/original).read_bytes()).hexdigest()
 inventory['assets'][name]={'sha256':digest,'bytes':asset.stat().st_size,'source':'Built-in image_gen, original generated artwork; binary copied unchanged','original':str(generated/original),'promptBriefNotVerbatim':brief,'integration':'CSS/canvas sprite rectangles or texture placement; no bitmap post-processing'}
inventory['revision']=243
(out/'visual-review/Royal-art-provenance.json').write_text(json.dumps(inventory,indent=2),encoding='utf-8')

report=f'''ROYAL VISUAL UPDATE — RUNTIME 243 — 17 NOVEMBER 2026
Overall verdict: NOT APP-STORE READY. The requested launch succeeded; work continued on presentation and real-device checks.

Launch and campaign preservation
- Opened http://127.0.0.1:8774/?build=242 visibly in the in-app browser. It restored England 1536, $593, nine workers. No turn was advanced. This was the latest packaged version when opened.
- Source and Android artifacts are now runtime243. Opened http://127.0.0.1:8774/?build=243 in the same visible tab after validation. Its refreshed state is England1538, $-148, nine workers. No orders or end-turn commands were issued. The earlier tab showed1536, so this is recorded as a view/save discrepancy whose timing and cause have not been established; do not claim identical before/after state.
- Exported England-1538.json through the game menu and copied a non-overwriting backup to outputs/campaign-backups/England-1538-before-further-work-20261117.json. Offline loadGame/saveGame roundtrip is byte-identical, including year1538 and cash-148. Did not restore an older campaign. Launch proof: outputs/visual-review/royal243/launched-campaign.jpg.
- Original Windows game, hotseat build and real saves untouched. The real Pixel package was neither reset nor replaced during these tests.

Presentation delivered
- Every one of the 30 regiment types has a distinct original painted portrait, used in recruitment, research, tactical rosters and map order markers. The world-map garrison remains a compact army tent.
- Fixed visible sprite fragments by using measured alpha bounds instead of assuming perfect atlas grid alignment. Retained the generated RGBA bitmap unchanged.
- Added quiet painted meadow variation to the campaign map and tactical battlefield. Battlefield uses one stretched texture, avoiding the repeat seam Claude identified.
- Replaced procedural line-wave sea with original painted cobalt ocean, bringing the local map closer to the supplied colourful reference. Strategic parchment, fog, sea-region borders and movement rules remain.
- Fixed short-landscape battle details: name, health/readiness and roster remain visible in separate non-overlapping regions. Removed obsolete sprite-grid CSS.
- Diplomacy list fits all five other great-power rows before scrolling, separates explanatory text below the list, and explicitly indicates further nations can be scrolled to. Added original enamel shield identification marks, with nation names and exact treaty states retained.
- Added subtle monochrome pigment variation clipped to diplomatic country fills. Borders, labels, fog and relation-colour rules remain unchanged. On tall desktop layouts, the five-row ledger and both complete maps are visible together; phone scrolling remains available.
- Existing minimap, unit cabinet, actual stocks/costs, navy/gold framing, parchment diplomacy, resource/development illustrations, management menus and strategic zoom remain.

Rules unchanged
Compared with the pre-change runtime242 root-module hashes: {audit['unchangedModuleCount']} existing modules unchanged. Only diplomacy-map.mjs, map.mjs and military-art.mjs changed; heraldry.mjs is new presentation code. No economic, research, transport, diplomatic, combat or AI rules changed. Audit: Royal-243-module-audit.json.

Current browser checks passed
- Thirty-type art coverage, CSS/canvas crop gallery at desktop, portrait and landscape; no asset errors, overflow or campaign mutation. Reviewed actual final catalog and battlefield screenshots.
- Eight desktop management screens, 360/412 portrait and 915 landscape, minimap pan, illustrated costs, map-only interaction and unchanged save bytes.
- Added measured assertions for the fifth diplomacy row and battle detail containment. Actual campaign battle deployment/save/reload/retreat/result/reload/return passes.
- Direct map engineer road/Undo, trade navigation lock, tent-to-province attack, target-local arrow and rescind pass.
- New art and heraldry are precached; offline reload/save-menu test passes.
- Home/Nation/World, button zoom, synthetic two-finger pinch, anchored wheel selection and label draw-order checks pass. These are desktop Chromium checks, not physical-device pinch-feel evidence.
- Fog/label checks pass: unseen western regions do not expose eastern sea labels, and the camera remains bounded. Final packaged Android-origin asset smoke passes save roundtrip, diplomacy, upgrades, fleet/army/port and colonial redeployment interactions in isolated Chromium.
- Damaged-save recovery/raw export/import/previous-turn recovery and unsupported-WebView/missing-module startup safeguards pass.
- Earlier runtime242 full rule suite: 940 passed. That full suite was not rerun for this presentation-only pass; the unchanged-rule audit and focused UI checks are the current evidence.

Physical Pixel testing — bounded evidence
- Device: Pixel10, Android17, WebView157.0.8103.38. Used separate com.paddy.imperialism.validation243 and its test runner, labeled Art validation243. Real com.paddy.imperialism.rebuild was not touched.
- PASS: injected Android touchscreen selected an Engineer, issued an adjacent road, undid it, and started funded research.
- PASS: real WebView startup, portrait/landscape rotation, ordinary native Back, and market Leave/Stay navigation guard.
- PASS: exact campaign checksum and pending export survive force-stop and update-install. Document-picker result was simulated; the real system picker UI was NOT tested.
- PASS: unreadable-file preservation, quarantine without changing bytes, UTF-8 size rejection, and path allowlist in isolated storage.
- INCONCLUSIVE: deliberately corrupt primary-save recovery test. Another app became active and JavaScript timed out. Testing stopped. An unrelated failure capture was removed from local outputs and the isolated app's external files; it was not supplied to Claude.
- Test harness now refuses JavaScript, touch input and screenshots when another app is foreground, after a read-only initial launch wait. The normal runner still refuses physical devices. Validation staging permits only the exact separate validation package; takeover simulation remains emulator-only.
- Pixel checks were on the first243 staging snapshot, before final portrait-boundary, diplomacy and landscape-layout adjustments. They validate unchanged native/game behavior, NOT the final artifact's complete visual or performance acceptance. Do not change build report pixelTested to true for the final APK.

Runtime243 native-host emulator checks
- API36 headless host-GPU emulator: corrupt-save recovery Back shows Leave/Stay, cancelling retains recovery and original bytes. PASS (Android243-emulator-recovery.txt).
- Home takeover rejects JavaScript, touch and screenshot attempts and writes no foreign-app image. PASS (Android243-emulator-takeover.txt).
- First guard run refused the initial accessibility-window transition; runner was corrected to wait read-only for its own initial window. Successful rerun recorded. No production host change was needed.
- Emulator stopped after tests. Physical phone interaction remains stopped.
- These native-host checks preceded the final ocean/pigment presentation adjustments. Native host code is unchanged; the final packaged visual assets were checked separately in Chromium, not reinstalled on the physical phone.

Artifacts
- Development APK: {apk['bytes']} bytes, SHA256 {apk['sha256']}.
- Unsigned AAB: {bundle['bytes']} bytes, SHA256 {bundle['sha256']}.
- Version243, target SDK{bundle['targetSdk']}, {bundle['assetsVerified']} source assets verified in APK/AAB, signature/alignment and official bundletool validation pass. Report version now comes from manifest instead of stale hard-coded242.
- No store upload, release signing or original installation change. No live campaign orders or turn advancement were issued; the observed1536/1538 view/save discrepancy is described above rather than being treated as proof of unchanged live state.

Claude review
- Actual connector reviews retained in Claude-243-initial-review.txt and Claude-243-followup-review.txt. Claude reads files/screenshots; it does not run the game.
- Initial reference misidentification was independently corrected, and Claude subsequently acknowledged it. Parent verified the real Madrid/Aragon reference is not a remake screenshot.
- Four concrete follow-up findings (diplo row clipping/scroll affordance, landscape battle detail, battlefield repeat seam, obsolete CSS) have been addressed and independently checked. Claude-243-closure-review.txt closes all four on source/screenshots.
- After painted ocean integration, Claude-243-art-direction-review.txt gives a positive visual verdict: a clear craft upgrade over the original within the requested navy/gold/parchment/painterly style. Its remaining flat diplomatic-fill concern was then addressed.
- Claude-243-pigment-closure.txt confirms the final clipped pigment texture, complete desktop maps and readable phone layout, and closes that final specific visual concern. These are source/screenshot reviews, not evidence of a complete game or a store-readiness endorsement.

Remaining work
1. Final-art acceptance on the physical device, zoom feel, performance and extended play. The desktop screenshot comparison has a positive Claude verdict, but does not substitute for these checks.
2. Pixel corrupt-save recovery without interruption; actual document-picker import/export; supported-device/OS coverage.
3. Competent complete campaigns and balance evidence, known colony/protection/non-aggression, blockade/conquest/event gaps. Presentation work did not silently invent or remove these systems.
4. Agreed independent name and content provenance; publisher identity/support email/privacy hosting; upload signing and store declarations. Independently branded release was requested, but no replacement name has been approved or applied.
5. Food summary clarity: the current campaign shows Food13/13 with a shortfall warning. Source inspection confirms the warning checks grain and meat/fish separately, while the displayed ratio is their total. Preserve those diet rules, but improve the label so the deficient food type is immediately clear. No unverified economic-rule change was made.

Next priorities: remaining device and full-campaign validation, clearer diet-status presentation, and independent release identity/content provenance. Do not treat valid build artifacts or narrow visual approval as store readiness.
'''
(out/'Royal-243-implementation-and-validation.txt').write_text(report,encoding='utf-8')
headline='CURRENT STATUS — 2026-11-17 — RUNTIME243\nNOT APP-STORE READY. Latest game opened at England1538 with an exported backup; earlier tab1536 discrepancy recorded. Thirty regiment portraits, painted ground/ocean, textured diplomacy and layout fixes delivered. Claude accepts the narrow visual upgrade; this is not store approval. Isolated Pixel touch/rotation/market/save-update/storage checks passed; interrupted Pixel recovery and final visual/performance/picker acceptance remain. Emulator recovery/takeover checks pass. Read outputs/Royal-243-implementation-and-validation.txt for evidence and limits.\n\n'
for name in ['Release-readiness.txt','Standalone-rebuild-status.txt']:
 p=out/name;s=p.read_text(encoding='utf-8')
 if s.startswith('CURRENT STATUS — 2026-11-17 — RUNTIME243'):
  s=s.split('\n\n',1)[1]
 p.write_text(headline+s,encoding='utf-8')
print('Wrote runtime243 evidence, module audit references, artifact metadata and generated-art provenance.')
