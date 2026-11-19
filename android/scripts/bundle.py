"""Build/validate an Android App Bundle; signing is an explicit separate option.

Default output is unsigned, deliberately unsuitable for accidental submission.
--sign uses IMP_UPLOAD_KEYSTORE, IMP_UPLOAD_ALIAS, IMP_UPLOAD_STORE_PASSWORD,
and IMP_UPLOAD_KEY_PASSWORD. Passwords are passed by environment name only.
"""
from pathlib import Path
import argparse, hashlib, json, os, subprocess, sys, zipfile
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
TOOLS=Path(os.environ.get('IMP_ANDROID_TOOLCHAIN','C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/work/toolchain'))
JAVA=Path(os.environ['JAVA_HOME'])/'bin' if os.environ.get('JAVA_HOME') else TOOLS/'jdk/jdk-17.0.20.1+1/bin'
SDK=Path(os.environ.get('IMP_ANDROID_SDK',str(ROOT/'work/sdk36')))
BUILD=SDK/'build-tools/36.0.0'
PLATFORM=SDK/'platforms/android-36/android.jar'
BUNDLETOOL=Path(os.environ.get('IMP_BUNDLETOOL',str(ROOT/'work/release-tools/bundletool-all-1.18.3.jar')))
OUT=ROOT/'work/rebuild-android'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--sign',action='store_true')
args=parser.parse_args()
def run(*argv): subprocess.run([str(a) for a in argv],cwd=ROOT,check=True)
if not BUNDLETOOL.is_file(): raise SystemExit('Official bundletool-all jar required; set IMP_BUNDLETOOL.')
if args.sign:
 for key in ('IMP_UPLOAD_KEYSTORE','IMP_UPLOAD_ALIAS','IMP_UPLOAD_STORE_PASSWORD','IMP_UPLOAD_KEY_PASSWORD'):
  if not os.environ.get(key): raise SystemExit('Missing signing configuration: '+key)
 if Path(os.environ['IMP_UPLOAD_KEYSTORE']).resolve()==(OUT/'development.keystore').resolve():
  raise SystemExit('The development signing key cannot be used for a store upload.')
run(sys.executable,'-X','utf8',ROOT/'android/scripts/build.py')
run(BUILD/'aapt2.exe','link','--proto-format','-I',PLATFORM,'--manifest',ROOT/'android/src/main/AndroidManifest.xml','-R',OUT/'resources.zip','-A',OUT/'assets','-o',OUT/'proto.apk')
with zipfile.ZipFile(OUT/'proto.apk') as source,zipfile.ZipFile(OUT/'base-module.zip','w',zipfile.ZIP_DEFLATED) as module:
 for name in source.namelist():
  module.writestr('manifest/AndroidManifest.xml' if name=='AndroidManifest.xml' else name,source.read(name))
 module.write(OUT/'dex/classes.dex','dex/classes.dex')
bundle=ROOT/'outputs/Imperialism-Rebuild-unsigned.aab'
run(JAVA/'java.exe','-jar',BUNDLETOOL,'build-bundle','--modules='+str(OUT/'base-module.zip'),'--output='+str(bundle),'--overwrite')
with (ROOT/'outputs/Android-bundle-validation-log.txt').open('w',encoding='utf-8') as log:
 subprocess.run([str(JAVA/'java.exe'),'-jar',str(BUNDLETOOL),'validate','--bundle='+str(bundle)],cwd=ROOT,check=True,stdout=log,stderr=subprocess.STDOUT)
build=json.loads((ROOT/'outputs/Standalone-Android-build.json').read_text(encoding='utf-8'))
with zipfile.ZipFile(bundle) as archive:
 for name,digest in build['assets'].items():
  if hashlib.sha256(archive.read('base/'+name)).hexdigest()!=digest: raise RuntimeError('Bundle asset mismatch: '+name)
 assert archive.read('base/dex/classes.dex')==(OUT/'dex/classes.dex').read_bytes()
if args.sign:
 signed=ROOT/'outputs/Imperialism-Rebuild-upload.aab'
 run(JAVA/'jarsigner.exe','-keystore',os.environ['IMP_UPLOAD_KEYSTORE'],'-storepass:env','IMP_UPLOAD_STORE_PASSWORD','-keypass:env','IMP_UPLOAD_KEY_PASSWORD','-signedjar',signed,bundle,os.environ['IMP_UPLOAD_ALIAS'])
 run(JAVA/'jarsigner.exe','-verify',signed)
 bundle=signed
manifest=ET.parse(ROOT/'android/src/main/AndroidManifest.xml').getroot()
android='{http://schemas.android.com/apk/res/android}'
version=int(manifest.attrib[android+'versionCode'])
target=int(manifest.find('uses-sdk').attrib[android+'targetSdkVersion'])
report={'bundle':bundle.name,'sha256':hashlib.sha256(bundle.read_bytes()).hexdigest(),'bytes':bundle.stat().st_size,'targetSdk':target,'versionCode':version,'assetsVerified':len(build['assets']),'bundletoolValidated':True,'uploadSigned':args.sign,'storeReady':False,'unresolved':['Complete physical-device lifecycle, document-picker, performance and long-play validation','Final branding and distribution provenance','Public privacy policy and developer/store declarations','Final gameplay completeness and campaign validation']}
(ROOT/'outputs/Android-bundle-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
