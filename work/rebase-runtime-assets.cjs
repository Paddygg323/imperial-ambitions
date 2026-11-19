const fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto');
const project='C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone';
const assetRoot=project+'/src/winlator-app-main/app/src/main/assets';
const backupRoot=project+'/work/original-runtime-assets';
const oldPrefix=Buffer.from('/data/data/com.winlator'),newPrefix=Buffer.from('/data/data/org.imp2phon');
if(oldPrefix.length!==newPrefix.length)throw Error('Rebase must preserve string length');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function hash(b){return crypto.createHash('sha256').update(b).digest('hex');}
function replaceBytes(b){let n=0;for(let at=b.indexOf(oldPrefix);at>=0;at=b.indexOf(oldPrefix,at+newPrefix.length)){newPrefix.copy(b,at);n++;}return n;}
const report=[];
for(const name of files(assetRoot).filter(p=>p.endsWith('.tzst'))) {
 const original=fs.readFileSync(name);
 const tar=zlib.zstdDecompressSync(original,{maxOutputLength:1024*1024*1024});
 if(!tar.includes(oldPrefix))continue;
 const changed=[];
 for(let offset=0;offset+512<=tar.length;) {
  const header=tar.subarray(offset,offset+512);
  const entryName=header.subarray(0,100).toString().split('\0')[0];if(!entryName)break;
  const size=parseInt(header.subarray(124,136).toString().replace(/\0/g,'').trim()||'0',8);
  if(!Number.isFinite(size))throw Error('Invalid tar size');
  const headersChanged=replaceBytes(header),dataChanged=replaceBytes(tar.subarray(offset+512,offset+512+size));
  if(headersChanged) {
   header.fill(32,148,156);let sum=0;for(const byte of header)sum+=byte;
   header.write(sum.toString(8).padStart(6,'0')+'\0 ',148,8,'ascii');
  }
  if(headersChanged || dataChanged)changed.push({entry:entryName,headersChanged,dataChanged});
  offset+=512+Math.ceil(size/512)*512;
 }
 if(tar.includes(oldPrefix))throw Error('Unprocessed tar prefix');
 const relative=path.relative(assetRoot,name),backup=path.join(backupRoot,relative);
 fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,original);
 const modified=zlib.zstdCompressSync(tar,{params:{[zlib.constants.ZSTD_c_compressionLevel]:3}});
 fs.writeFileSync(name,modified);
 const roundTrip=zlib.zstdDecompressSync(modified,{maxOutputLength:1024*1024*1024});
 if(!roundTrip.equals(tar))throw Error('Compression round-trip mismatch');
 report.push({asset:relative,originalSHA256:hash(original),modifiedSHA256:hash(modified),
  originalCompressedBytes:original.length,modifiedCompressedBytes:modified.length,changed});
 console.log(relative+': '+changed.length+' entries rebased; compression round-trip verified');
}
fs.writeFileSync(project+'/research/runtime-asset-relocation.json',JSON.stringify(report,null,2));
const build=project+'/src/winlator-app-main/build.gradle';
fs.writeFileSync(build,fs.readFileSync(build,'utf8').replace('work/android-final-build-output','work/android-relocated-build-output'));
