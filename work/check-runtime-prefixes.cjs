const fs=require('fs'),path=require('path'),zlib=require('zlib');
const root='C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/src/winlator-app-main/app/src/main/assets';
const reports=[];
for(const relative of ['rootfs.tzst','rootfs_patches.tzst','pulseaudio.tzst','box64/box64-0.4.4.tzst']) {
 const tar=zlib.zstdDecompressSync(fs.readFileSync(path.join(root,relative)),{maxOutputLength:1024*1024*1024});
 const matches=[];
 for(let offset=0;offset+512<=tar.length;) {
  const header=tar.subarray(offset,offset+512);
  const name=header.subarray(0,100).toString().split('\0')[0];if(!name)break;
  const rawSize=header.subarray(124,136).toString().replace(/\0/g,'').trim();
  const size=parseInt(rawSize||'0',8);if(!Number.isFinite(size))throw Error('Invalid tar size');
  const data=tar.subarray(offset+512,offset+512+size);
  if(data.includes(Buffer.from('/data/data/com.winlator')) || header.includes(Buffer.from('/data/data/com.winlator')))
    matches.push(name);
  offset+=512+Math.ceil(size/512)*512;
 }
 reports.push({asset:relative,uncompressedBytes:tar.length,hardcodedPrivatePathFiles:matches});
}
fs.writeFileSync('C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/research/runtime-private-prefix-scan.json',JSON.stringify(reports,null,2));
console.log(JSON.stringify(reports));
