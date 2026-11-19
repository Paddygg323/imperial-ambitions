const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/src/winlator-app-main';
const id='org.imp2phon';
function edit(p,a,b){const s=fs.readFileSync(path.join(root,p),'utf8');if(!s.includes(a))throw Error(p);fs.writeFileSync(path.join(root,p),s.replace(a,b));}
edit('app/build.gradle',"applicationId 'org.imp2.phone'",`applicationId '${id}'`);
const gradle=path.join(root,'app/build.gradle');
let build=fs.readFileSync(gradle,'utf8');
build=build.replace(/    externalNativeBuild \{[\s\S]*?\n    \}/,'    // First test build reuses native libraries from official Winlator 11.2.');
build=build.replace("minifyEnabled true","minifyEnabled false");
fs.writeFileSync(gradle,build);
edit('app/src/main/java/com/winlator/core/AppUtils.java','"/data/data/com.winlator/storage"','"/data/data/"+com.winlator.BuildConfig.APPLICATION_ID+"/storage"');
// Same-length native cache path adaptation, with matching source change.
edit('app/src/main/cpp/winlator/include/winlator.h','/data/data/com.winlator/cache',`/data/data/${id}/cache`);
const before=Buffer.from('/data/data/com.winlator/cache'),after=Buffer.from(`/data/data/${id}/cache`);
if(before.length!==after.length)throw Error('Native patch length changed');
const natives=path.join(root,'app/src/main/jniLibs/arm64-v8a');
const hashes=[];
for(const name of fs.readdirSync(natives).filter(n=>n.endsWith('.so'))) {
 const file=path.join(natives,name),data=fs.readFileSync(file);
 const original=crypto.createHash('sha256').update(data).digest('hex');let count=0;
 for(let at=data.indexOf(before);at>=0;at=data.indexOf(before,at+after.length)) {after.copy(data,at);count++;}
 if(count)fs.writeFileSync(file,data);
 hashes.push({name,originalSHA256:original,sha256:crypto.createHash('sha256').update(data).digest('hex'),cachePathReplacements:count});
}
const out='C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/research';
fs.writeFileSync(path.join(out,'native-runtime-manifest.json'),JSON.stringify(hashes,null,2));
fs.writeFileSync(path.join(out,'runtime-provenance.txt'),`Runtime source: https://github.com/brunodev85/winlator-app\nSource revision recorded: 3981d86efa4f333b2a34a7da8b6521476cd8c8b9\nRuntime native libraries: official Winlator_11.2.apk from v11.2.0 release\nAll native libraries retain original bytes except same-length GPU cache path adaptation in manifest. Matching native header updated.\nOriginal upstream LGPL-2.1 LICENSE retained in source. Other component licenses remain in source. No game assets embedded.\nApplication ID: ${id}\nFirst debug APK uses prebuilt natives; source-native CMake build remains a future verification step.\n`);
console.log(hashes.filter(h=>h.cachePathReplacements));
