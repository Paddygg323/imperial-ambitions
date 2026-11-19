"""Compile the disposable Android instrumentation runner with the dev key."""
from pathlib import Path
import subprocess,zipfile,os
ROOT=Path(__file__).resolve().parents[2]
JAVA=Path(os.environ['JAVA_HOME'])/'bin' if os.environ.get('JAVA_HOME') else Path('C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/work/toolchain/jdk/jdk-17.0.20.1+1/bin')
SDK=Path(os.environ.get('IMP_ANDROID_SDK',str(ROOT/'work/sdk36')));BUILD=SDK/'build-tools/36.0.0';PLATFORM=SDK/'platforms/android-36/android.jar';OUT=ROOT/'work/rebuild-android-test'
for folder in ['classes','dex']:(OUT/folder).mkdir(parents=True,exist_ok=True)
def run(*args):subprocess.run([str(a) for a in args],cwd=ROOT,check=True)
run(JAVA/'javac.exe','--release','8','-classpath',PLATFORM,'-d',OUT/'classes',ROOT/'android/test/LifecycleChecks.java')
with zipfile.ZipFile(OUT/'classes.jar','w') as jar:
 for file in (OUT/'classes').rglob('*.class'):jar.write(file,file.relative_to(OUT/'classes').as_posix())
run(JAVA/'java.exe','-cp',BUILD/'lib/d8.jar','com.android.tools.r8.D8','--min-api','26','--lib',PLATFORM,'--output',OUT/'dex',OUT/'classes.jar')
run(BUILD/'aapt2.exe','link','-I',PLATFORM,'--manifest',ROOT/'android/test/AndroidManifest.xml','-o',OUT/'unsigned.apk')
with zipfile.ZipFile(OUT/'unsigned.apk') as src,zipfile.ZipFile(OUT/'packaged.apk','w') as dst:
 for info in src.infolist():dst.writestr(info.filename,src.read(info.filename),compress_type=info.compress_type)
 dst.write(OUT/'dex/classes.dex','classes.dex')
run(BUILD/'zipalign.exe','-f','4',OUT/'packaged.apk',OUT/'aligned.apk')
run(JAVA/'java.exe','-jar',BUILD/'lib/apksigner.jar','sign','--ks',ROOT/'work/rebuild-android/development.keystore','--ks-pass','pass:android','--key-pass','pass:android','--out',OUT/'lifecycle-tests.apk',OUT/'aligned.apk')
print('Built emulator-only lifecycle test APK.')
