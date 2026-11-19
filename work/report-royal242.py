from pathlib import Path
import hashlib,json,datetime
root=Path(__file__).resolve().parents[1]
baseline=json.loads((root/'work/royal242-hashes.json').read_text(encoding='utf-8'))
changed=[name for name,digest in baseline.items() if hashlib.sha256((root/name).read_bytes()).hexdigest()!=digest]
allowed={'app.mjs','battle-view.mjs','development-art.mjs','diplomacy-map.mjs','map.mjs','news-priority.mjs'}
assert all(Path(name).name in allowed for name in changed),changed
new=[str(p.relative_to(root)) for p in (root/'game').glob('*.mjs') if str(p.relative_to(root)) not in baseline]
audit={'revision':242,'date':'2026-11-17','changedExistingModules':changed,'newModules':new,'unchangedBaselineModuleCount':len(baseline)-len(changed),'ruleEngineUnchanged':True,'note':'Compared to the pre-overhaul hash baseline. Existing economy, research, trade, AI, combat, transport and world-generation rule modules are byte-identical. app/battle-view changes concern UI and save handling; news-priority changes concern outcome visibility. CSS, HTML, boot.js, artwork, Android host, packaging and tests are tracked separately.'}
(root/'outputs/Royal-242-module-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
apk=json.loads((root/'outputs/Standalone-Android-build.json').read_text())
bundle=json.loads((root/'outputs/Android-bundle-validation.json').read_text())
report=f'''ROYAL VISUAL OVERHAUL — RUNTIME 242 — 17 NOVEMBER 2026
Overall release verdict: NOT APP-STORE READY. Do not present visual approval, tests or a valid bundle as store approval.

Delivered presentation
- Navy brocade, original generated gilt frames, parchment folios, illustrated gold navigation and consistent crown icons.
- Real year, treasury and context heading; active-unit portrait and shortcuts; actual stock/construction-cost cabinet.
- Fog-aware draggable/keyboard minimap, useful local zoom, Nation/World views, natural coastline and parchment political overview.
- More legible resource/development art, cultivated rows, quiet empty ground, overhead hill/mountain relief, ships/civilians and compact army tents.
- Diplomacy parchment portraits, per-country relations meters, fielded military ratings and last-market trade bars; side-by-side political and relations maps. No fictitious variation in initially equal relationships, no disclosure of minor armies.
- Styled research, industry, transport, trade, recruitment, army, navy, world-news, orders and tactical-battle screens. Real battle hexes, readiness and target states remain interactive.
- Desktop, portrait phone, narrow portrait and landscape layouts. Compact minimap on phones leaves unit orders accessible. Actual Android screenshots exposed and led to a fix for a clipped landscape economy strip.

Reference features and intentional adaptations
The top date/cash/orders strip, four utility icons, minimap/viewport, unit portrait, circular shortcuts, illustrated material availability, actual construction costs, gold bottom navigation, terrain/sea/resource/town art and diplomacy scroll/bar layout are implemented.
Real construction costs are used, not the aspirational image's example brick/metal quantities. Army tents and sea-region movement preserve prior user requirements. Empty ground stays simple. Additional menus remain accessible rather than being removed to match the image's six-button ribbon.
Residual visual differences: existing painted unit/resource art repeats across tiles and some unit eras; the scene is less densely painted than the aspirational image. This report does not claim pixel-level reproduction or identical art quality across every screen.

Gameplay preservation
{len(baseline)-len(changed)} existing baseline root modules are byte-identical. Changed existing modules: {', '.join(Path(p).name for p in changed)}.
The engine's economy, technology prerequisites/unlocks, research funding rules, transport, trade, combat, AI and world generation were not changed by this visual pass. Source audit: Royal-242-module-audit.json.
Outcome/elimination notices were promoted above routine news and idle-research warnings suppressed after an ended campaign; this changes presentation only.

Persistence and Android host
- Atomic native campaign files are authoritative; existing WebView-only campaigns remain readable and migrate on the next save. LocalStorage remains a compatibility cache.
- Unreadable/malformed campaigns open explicit recovery. They cannot be silently replaced with a new game. Native unreadable bytes are quarantined by rename before replacement; an older cached export is labeled as such.
- One shared save policy generates Android constants; both layers enforce an 8 MB UTF-8 byte limit. Failed turn snapshots explicitly say the turn has not advanced.
- Pending document exports survive Activity/process recreation. Oversized export failure is visible. The real system document-picker interaction still needs physical-device verification; test result delivery was simulated.
- Android Back closes ordinary menus. During trading/recovery it presents a native Leave/Stay prompt while preserving the guarded screen, so it cannot bypass the market or discard recovery.
- Unsupported WebView or missing application modules show non-destructive startup guidance rather than a blank map.
- Local-only save behavior and the need to export before uninstall/clear-data/device changes are disclosed in the game menu and privacy draft.

Verified evidence
- Full unit/regression suite: 940 passed, zero failed/skipped/cancelled. Log: tests-runtime242-complete.txt.
- Browser UI: eight desktop menus; 412x915, 360x800 and 915x412 layouts; minimap drag, material costs, map-only, no save mutation, no artwork 404s or page errors. Economy summary bounds now checked.
- Actual campaign battle fixture: deployment, saved tile/reload, three viewports, retreat/result/reload and return to campaign.
- Direct commands: adjacent engineer road, Undo, market lock, tent-to-province attack, target-local arrow and rescind. Diplomacy selection and favoured partner fixtures pass.
- Packaged Android-origin Chromium: import/export/save roundtrip, diplomacy, upgrades, fleet/army/port controls and colonial redeployment. This is browser evidence, not Pixel evidence.
- Startup failure and save-recovery browser tests: original bytes retained, cache/original distinguished, Escape/native-cancel protection, raw export, previous-turn restoration and valid import, invalid import rejection.
- API36 x86_64 Google APIs emulator with host graphics: actual WebView launch, funded research, native Back, rotation, market guard, exact latest campaign across force-stop and update-install, and pending export completion after recreation.
- Actual injected Android touchscreen events: selected Engineer, ordered an adjacent road, used Undo, started funded research. Native storage tests exercise unreadable file preservation, UTF-8 size rejection and path validation.
- Native recovery Back test shows Leave/Stay and retains the original unreadable save when cancelled.
- Native test source: android/test/LifecycleChecks.java and android/scripts/build-test.py. Logs: Android-emulator-prepare-hostgpu.txt, Android-emulator-resume.txt, Android-emulator-touch.txt, Android-emulator-storage.txt, Android-emulator-recovery-back.txt.
- The initial software-renderer emulator stalled; host graphics passed. A first touchscreen test fixture failed because injected relative module URLs did not resolve; absolute module URLs fixed the fixture without changing game input.
- Archived actual 155-turn defeat loads correctly, shows the capital-loss outcome and disables End Turn. That campaign was not competent human play and is not evidence of a balanced complete game or verified player victory.

Built artifacts
Development APK: {apk['apk']}, {apk['bytes']} bytes, SHA256 {apk['sha256']}.
Unsigned Android App Bundle: {bundle['bundle']}, {bundle['bytes']} bytes, SHA256 {bundle['sha256']}.
Version 242, target SDK36, {apk['assetCount']} packaged source assets verified; APK signature/alignment and official bundletool validation passed. No native emulator/Windows runtime is inside the app. No upload signing or publication performed.

Claude review and evidence limits
Repeated actual Claude connector reviews read code and screenshots. Claude found save and Back issues which were corrected. It did not execute the game or certify a store submission.
Claude accepted the direction and the diplomacy/engineer chrome as an upgrade over the original footage, but noted painterly-density/fidelity differences. One later image response misidentified the 915x412 remake screenshot as original footage; direct viewing and matching SHA256 verified the remake image, and a correction/review was requested. Do not treat that image description as evidence.
Review text retained in Claude-242-release-review.txt, Claude-242-followup-review.txt and Claude-242-final-review.txt; closure response will be retained separately.
Generated-art inventory and hashes: visual-review/Royal-art-provenance.json. Artwork is newly generated; extracted original text/data and branding are separate provenance questions.

Still required before a responsible public release
1. Physical Pixel testing: real touch/zoom feel, extended play, performance, minimum supported WebView/OS, real document-picker import/export and lifecycle. ADB currently sees only the isolated emulator, not the Pixel.
2. Complete-game validation: competent fresh campaigns through verified victory and defeat, and balance/AI review. Existing automated late-game evidence is not a replacement.
3. Existing original-system gaps: tribal colony/protection/non-aggression workflows; neutral-blockade cancellation details; conquest rewards/civilian deportation; rare random-event scheduling/probabilities. These were neither invented nor silently removed during a graphics-only pass. The in-game development notices remain.
4. Publisher decisions: authorized use of the Imperialism name and extracted text/data versus an independently branded/content build; Play developer account, final support/privacy URL, upload signing key, content/data-safety/store declarations.
Privacy/store listing drafts are in outputs/release and contain explicit missing publisher fields. They are not published policies or submitted declarations.

Preservation
Original PC installation, hotseat build and all real campaign saves were not modified. Only disposable browser contexts and an explicitly targeted headless emulator were reset during testing. No physical phone data was cleared and no real game was advanced.
'''
(root/'outputs/Royal-242-implementation-and-validation.txt').write_text(report,encoding='utf-8')
prefix='''CURRENT STATUS — 2026-11-17 — RUNTIME 242
NOT APP-STORE READY. Visual overhaul, 940 passing rule tests, phone/desktop browser checks, native Android emulator touch/lifecycle/recovery tests and a validated target36 APK/unsigned AAB are delivered. Rules are unchanged by this graphics pass. Physical Pixel, competent full-campaign validation, known original-system gaps and publisher/signing/provenance inputs remain.
Read outputs/Royal-242-implementation-and-validation.txt for current evidence and limits. Later historical entries below describe earlier revisions and do not supersede this status.

'''
for name in ['Release-readiness.txt','Standalone-rebuild-status.txt']:
 path=root/'outputs'/name;old=path.read_text(encoding='utf-8')
 if not old.startswith('CURRENT STATUS — 2026-11-17 — RUNTIME 242'):path.write_text(prefix+old,encoding='utf-8')
print(json.dumps({'rulesUnchanged':True,'baselineModulesVerified':len(baseline)-len(changed),'newModules':new,'report':'outputs/Royal-242-implementation-and-validation.txt'},indent=2))
