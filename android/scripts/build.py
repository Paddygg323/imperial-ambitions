"""Build independent offline APK with installed SDK tools, no Gradle downloads."""
from pathlib import Path
import hashlib,json,os,re,shutil,subprocess,zipfile
ROOT=Path(__file__).resolve().parents[2]
TOOLS=Path(os.environ.get('IMP_ANDROID_TOOLCHAIN','C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/work/toolchain'))
JAVA=Path(os.environ['JAVA_HOME'])/'bin' if os.environ.get('JAVA_HOME') else TOOLS/'jdk/jdk-17.0.20.1+1/bin'
SDK=Path(os.environ.get('IMP_ANDROID_SDK',str(ROOT/'work/sdk36')))
BUILD=SDK/'build-tools/36.0.0'
PLATFORM=SDK/'platforms/android-36/android.jar'
if not PLATFORM.is_file() or not BUILD.is_dir():
 raise SystemExit('Install Android platform36 and build-tools36.0.0 into work/sdk36, or set IMP_ANDROID_SDK to that SDK.')
OUT=ROOT/'work/rebuild-android'
for part in ['assets/game','classes','dex']: (OUT/part).mkdir(parents=True,exist_ok=True)
# Never carry obsolete inner classes from a previous build into the APK.
classes=(OUT/'classes').resolve()
if not classes.is_relative_to((ROOT/'work/rebuild-android').resolve()):raise RuntimeError('Class staging escaped the build directory')
shutil.rmtree(classes)
classes.mkdir()
def run(*args):
 subprocess.run([str(a) for a in args],cwd=ROOT,check=True)
# Stage only the standalone engine's assets, excluding test/server programs.
assets={}
for source in (ROOT/'game').rglob('*'):
 rel=source.relative_to(ROOT/'game')
 if not source.is_file() or 'test' in rel.parts or source.suffix not in ['.mjs','.js','.html','.css','.svg','.png','.json','.webmanifest']:continue
 dest=OUT/'assets/game'/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,dest)
 assets['assets/game/'+rel.as_posix()]=hashlib.sha256(source.read_bytes()).hexdigest()
# Remove stale staged assets only inside the verified staging directory.
for dest in (OUT/'assets/game').rglob('*'):
 if dest.is_file() and 'assets/game/'+dest.relative_to(OUT/'assets/game').as_posix() not in assets:dest.unlink()
# One source for the browser/native save slot and UTF-8 byte limit.
policy=(ROOT/'game/save-policy.mjs').read_text(encoding='utf-8')
slot=re.search(r"export const SAVE_SLOT='([a-z0-9-]+)';",policy).group(1)
limit=int(re.search(r'export const MAX_SAVE_BYTES=(\d+);',policy).group(1))
generated=OUT/'generated/SavePolicy.java';generated.parent.mkdir(exist_ok=True)
generated.write_text('package com.paddy.imperialism.rebuild;\nfinal class SavePolicy { static final String SLOT="'+slot+'"; static final int MAX_BYTES='+str(limit)+'; }\n',encoding='utf-8')
run(JAVA/'javac.exe','--release','8','-classpath',PLATFORM,'-d',OUT/'classes',generated,ROOT/'android/src/main/java/com/paddy/imperialism/rebuild/MainActivity.java')
with zipfile.ZipFile(OUT/'classes.jar','w') as jar:
 for cls in (OUT/'classes').rglob('*.class'):jar.write(cls,cls.relative_to(OUT/'classes').as_posix())
run(JAVA/'java.exe','-cp',BUILD/'lib/d8.jar','com.android.tools.r8.D8','--min-api','26','--lib',PLATFORM,'--output',OUT/'dex',OUT/'classes.jar')
run(BUILD/'aapt2.exe','compile','--dir',ROOT/'android/src/main/res','-o',OUT/'resources.zip')
run(BUILD/'aapt2.exe','link','-I',PLATFORM,'--manifest',ROOT/'android/src/main/AndroidManifest.xml','-R',OUT/'resources.zip','-A',OUT/'assets','-o',OUT/'unsigned.apk')
# Normalize aapt2 ZIP headers before adding dex, then align the final archive.
with zipfile.ZipFile(OUT/'unsigned.apk') as source,zipfile.ZipFile(OUT/'packaged.apk','w') as packaged:
 for info in source.infolist():packaged.writestr(info.filename,source.read(info.filename),compress_type=info.compress_type)
 packaged.write(OUT/'dex/classes.dex','classes.dex',compress_type=zipfile.ZIP_DEFLATED)
run(BUILD/'zipalign.exe','-f','4',OUT/'packaged.apk',OUT/'aligned.apk')
key=OUT/'development.keystore'
if not key.exists():run(JAVA/'keytool.exe','-genkeypair','-keystore',key,'-storepass','android','-keypass','android','-alias','development','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=Imperialism Rebuild Development')
apk=ROOT/'outputs/Imperialism-Rebuild-development.apk'
run(JAVA/'java.exe','-jar',BUILD/'lib/apksigner.jar','sign','--ks',key,'--ks-pass','pass:android','--key-pass','pass:android','--out',apk,OUT/'aligned.apk')
run(JAVA/'java.exe','-jar',BUILD/'lib/apksigner.jar','verify','--verbose',apk)
run(BUILD/'zipalign.exe','-c','4',apk)
with zipfile.ZipFile(apk) as archive:
 for name,digest in assets.items():assert hashlib.sha256(archive.read(name)).hexdigest()==digest,name
 assert not any(n.endswith(('.exe','.dll','.so')) for n in archive.namelist())
 assert archive.read('classes.dex')==(OUT/'dex/classes.dex').read_bytes()
report={'apk':apk.name,'bytes':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'assetCount':len(assets),'assets':assets,'pixelTested':False,'completeGame':False}
(ROOT/'outputs/Standalone-Android-build.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='assets'},indent=2))
