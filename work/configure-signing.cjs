const fs=require('fs'),path=require('path');
const root='C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone';
const app=root+'/src/winlator-app-main/app';
fs.appendFileSync(app+'/build.gradle',`
android {
    signingConfigs {
        debug {
            storeFile file('C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/work/toolchain/imp2-debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
            storeType 'PKCS12'
        }
    }
}
`);
fs.mkdirSync(root+'/work/prebuilt-native-reference',{recursive:true});
fs.renameSync(app+'/src/main/jniLibs/arm64-v8a/libzstd-jni-1.5.2-3.so',root+'/work/prebuilt-native-reference/libzstd-jni-1.5.2-3.so');
const gradle=root+'/src/winlator-app-main/build.gradle';
fs.writeFileSync(gradle,fs.readFileSync(gradle,'utf8').replace('work/android-direct-build-output','work/android-signed-build-output'));
const manifestFile=root+'/research/native-runtime-manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
const zstd=manifest.find(e=>e.name==='libzstd-jni-1.5.2-3.so');
zstd.packagedFrom='zstd-jni-1.5.2-3 Maven AAR';
zstd.packagedSHA256='e7f9255ce970c4c0e6aaf3d7c22722990d62bd66867e27b0298b3bb55ee0c255';
fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2));
console.log('Signing configured; duplicate native copy preserved separately');
