const fs=require('fs'),path=require('path');
const root='C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/src/winlator-app-main/app/src/main';
const libs=fs.readdirSync(root+'/jniLibs/arm64-v8a').filter(n=>n.endsWith('.so')).map(n=>fs.readFileSync(root+'/jniLibs/arm64-v8a/'+n));
const missing=[];let checked=0;
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const f of files(root+'/java').filter(n=>n.endsWith('.java'))) {
 const s=fs.readFileSync(f,'utf8'),pkg=s.match(/package\s+([\w.]+);/)?.[1];
 for(const m of s.matchAll(/\bnative\s+[\w<>\[\].]+\s+(\w+)\s*\(/g)) {
  const symbol='Java_'+pkg.replaceAll('.','_')+'_'+path.basename(f,'.java')+'_'+m[1].replaceAll('_','_1');
  if(!libs.some(b=>b.includes(Buffer.from(symbol))))missing.push(symbol);checked++;
 }
}
const report={checked,missing,scope:'JNI symbol-name presence only; not ABI or runtime gameplay verification'};
fs.writeFileSync('C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/research/native-bindings-check.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
if(missing.length)process.exitCode=1;
