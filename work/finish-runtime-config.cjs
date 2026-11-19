const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root='C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/src/winlator-app-main';
const nativeDir=path.join(root,'app/src/main/jniLibs/arm64-v8a');
const manifestFile='C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/research/native-runtime-manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
const before=Buffer.from('/data/data/com.winlator/'),after=Buffer.from('/data/data/org.imp2phon/');
for(const entry of manifest){const p=path.join(nativeDir,entry.name),b=fs.readFileSync(p);let n=0;
 for(let at=b.indexOf(before);at>=0;at=b.indexOf(before,at+after.length)){after.copy(b,at);n++;}
 if(n)fs.writeFileSync(p,b);entry.privatePathReplacements=(entry.cachePathReplacements||0)+n;
 entry.sha256=crypto.createHash('sha256').update(b).digest('hex');
}
fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2));
for(const p of ['app/src/main/cpp/gladiorenderer/include/gladio.h','app/src/main/cpp/vortekrenderer/include/vortek.h']) {
 const f=path.join(root,p);fs.writeFileSync(f,fs.readFileSync(f,'utf8').replaceAll('/data/data/com.winlator/','/data/data/org.imp2phon/'));
}
let f=path.join(root,'build.gradle'),s=fs.readFileSync(f,'utf8');
s=s.replaceAll('mavenCentral()',"maven { url 'http://127.0.0.1:18764/central'; allowInsecureProtocol = true }");
s=s.replaceAll('google()',"maven { url 'http://127.0.0.1:18764/google'; allowInsecureProtocol = true }");fs.writeFileSync(f,s);
f=path.join(root,'app/build.gradle');s=fs.readFileSync(f,'utf8').replace("    compileSdk 35","    compileSdk 35\n    buildFeatures { buildConfig true }");fs.writeFileSync(f,s);
console.log('Private runtime paths and build-only repository cache configured');
