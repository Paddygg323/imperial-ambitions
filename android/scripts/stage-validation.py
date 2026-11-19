"""Stage an isolated physical-device validation app; never targets player data.

Run this, then the staged build.py and build-test.py. The ordinary emulator
runner keeps its physical-device refusal. Game assets are copied unchanged.
"""
from pathlib import Path
import hashlib, json, shutil

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'work/royal243-device'
PACKAGE = 'com.paddy.imperialism.validation243'
assert PACKAGE != 'com.paddy.imperialism.rebuild'
DEST.mkdir(parents=True, exist_ok=True)
shutil.copytree(ROOT / 'game', DEST / 'game', dirs_exist_ok=True)
shutil.copytree(ROOT / 'android/src', DEST / 'android/src', dirs_exist_ok=True)
(DEST / 'android/scripts').mkdir(parents=True, exist_ok=True)
(DEST / 'android/test').mkdir(parents=True, exist_ok=True)
(DEST / 'outputs').mkdir(exist_ok=True)
(DEST / 'work/rebuild-android').mkdir(parents=True, exist_ok=True)
shutil.copyfile(ROOT / 'work/rebuild-android/development.keystore', DEST / 'work/rebuild-android/development.keystore')

for relative in ['android/scripts/build.py', 'android/scripts/build-test.py',
                 'android/test/LifecycleChecks.java', 'android/test/AndroidManifest.xml']:
    text = (ROOT / relative).read_text(encoding='utf-8')
    if relative.endswith('build.py'):
        text = text.replace("str(ROOT/'work/sdk36')", repr(str(ROOT / 'work/sdk36')))
    if relative.endswith('build-test.py'):
        text = text.replace("SDK=ROOT/'work/sdk36'", 'SDK=Path(' + repr(str(ROOT / 'work/sdk36')) + ')')
        text = text.replace('Built emulator-only lifecycle test APK.', 'Built isolated validation-package test APK; player package is forbidden.')
    text = text.replace('com.paddy.imperialism.rebuild', PACKAGE)
    if relative.endswith('LifecycleChecks.java'):
        old = 'require(android.os.Build.FINGERPRINT.contains("generic")||android.os.Build.FINGERPRINT.contains("emulator")||android.os.Build.HARDWARE.equals("ranchu"),"Refusing to alter a physical phone");'
        assert old in text
        text = text.replace(old, 'require(getTargetContext().getPackageName().equals("' + PACKAGE + '"),"Refusing to alter any package except the isolated validation app");')
        text = text.replace('Disposable emulator tests. Never run against the player\'s physical device.', 'Disposable physical-device tests. Only the isolated validation package is permitted.')
        text = text.replace('no physical Pixel tested.', 'physical Pixel validation package tested; real document picker UI not tested.')
    (DEST / relative).write_text(text, encoding='utf-8')

manifest = DEST / 'android/src/main/AndroidManifest.xml'
manifest.write_text(manifest.read_text().replace('com.paddy.imperialism.rebuild', PACKAGE).replace('Imperialism Rebuild (Dev)', 'Art validation 243'), encoding='utf-8')
activity = DEST / 'android/src/main/java/com/paddy/imperialism/rebuild/MainActivity.java'
activity.write_text(activity.read_text().replace('com.paddy.imperialism.rebuild', PACKAGE), encoding='utf-8')
# Preserve the original source path expected by build.py; Java package and
# manifest identity are isolated. No change to the real build or its save slot.
build = DEST / 'android/scripts/build.py'
build.write_text(build.read_text().replace('com/paddy/imperialism/validation243/MainActivity.java', 'com/paddy/imperialism/rebuild/MainActivity.java'), encoding='utf-8')
files = {}
for source in (ROOT / 'game').rglob('*'):
    if not source.is_file(): continue
    relative = source.relative_to(ROOT)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    assert hashlib.sha256((DEST / relative).read_bytes()).hexdigest() == digest
    files[relative.as_posix()] = digest
(DEST / 'source-audit.json').write_text(json.dumps({'package': PACKAGE, 'source': str(ROOT), 'files': files}, indent=2), encoding='utf-8')
print(DEST)
