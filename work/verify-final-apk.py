import json,hashlib,zipfile,pathlib
p=pathlib.Path('C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone')
apk=pathlib.Path('work/android-relocated-build-output/app/outputs/apk/debug/app-debug.apk')
with zipfile.ZipFile(apk) as z:
    libs=json.loads((p/'research/native-runtime-manifest.json').read_text(encoding='utf-8-sig'))
    for e in libs:
        assert hashlib.sha256(z.read('lib/arm64-v8a/'+e['name'])).hexdigest()==e.get('packagedSHA256',e['sha256']),e['name']
    assets=json.loads((p/'research/runtime-asset-relocation.json').read_text(encoding='utf-8-sig'))
    for e in assets:
        assert hashlib.sha256(z.read('assets/'+e['asset'].replace('\\','/'))).hexdigest()==e['modifiedSHA256'],e['asset']
    assert not any('imperialism' in n.lower() or n.lower().endswith('.rsrc') for n in z.namelist())
report={'nativeLibrariesVerified':len(libs),'relocatedAssetsVerified':len(assets),'bytes':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'phoneGameplay':'unverified'}
(p/'research/final-apk-verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
