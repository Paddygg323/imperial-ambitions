const fs=require('fs'),path=require('path'),z=require('zlib');
const root='C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/src/winlator-app-main/app/src/main/assets';
function files(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.join(d,e.name)]);}
let archives=0,entries=0;
for(const f of files(root).filter(f=>f.endsWith('.tzst'))){
 const b=z.zstdDecompressSync(fs.readFileSync(f),{maxOutputLength:1024*1024*1024});
 for(const prefix of ['/data/data/com.winlator','/data/user/0/com.winlator'])if(b.includes(Buffer.from(prefix)))throw Error('Old prefix: '+f);
 for(let o=0;o+512<=b.length;){const h=b.subarray(o,o+512);if(h.every(x=>x===0))break;const expected=parseInt(h.subarray(148,156).toString().replace(/\0/g,'').trim(),8);let sum=0;for(let i=0;i<512;i++)sum+=i>=148&&i<156?32:h[i];if(sum!==expected)throw Error('Checksum '+f+' '+o);const size=parseInt(h.subarray(124,136).toString().replace(/\0/g,'').trim()||'0',8);if(!Number.isFinite(size)||o+512+size>b.length)throw Error('Size '+f);entries++;o+=512+Math.ceil(size/512)*512;}
 archives++;
}
console.log(JSON.stringify({archives,entries,tarChecksums:'passed',oldPrivatePrefixes:'none'}));
