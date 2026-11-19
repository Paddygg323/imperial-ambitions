const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {Readable}=require('stream'),{pipeline}=require('stream/promises');
const xml=fs.readFileSync('work/android-repository.xml','utf8');
const base='C:/Users/paddy/OneDrive/Desktop/IMP 2 Phone/work/toolchain';
async function download(url,name,checksum) {
 const dest=path.join(base,name);
 const n=fs.existsSync(dest)?fs.statSync(dest).size:0;
 const res=await fetch(url,{headers:n?{Range:`bytes=${n}-`}:{}});
 if(!res.ok)throw Error(`${name} HTTP ${res.status}`);
 await pipeline(Readable.fromWeb(res.body),fs.createWriteStream(dest,{flags:res.status===206?'a':'w'}));
 if(checksum) {
  const hash=crypto.createHash(checksum.length===40?'sha1':'sha256');
  for await (const chunk of fs.createReadStream(dest))hash.update(chunk);
  if(hash.digest('hex')!==checksum)throw Error(`${name}: checksum mismatch`);
 }
 console.log(name+' complete');
}
const jobs=[];
for(const [id,name] of [['platforms;android-35','platform35.zip'],['build-tools;34.0.0','build34.zip']]) {
 const start=xml.indexOf(`<remotePackage path="${id}"`);
 if(start<0)throw Error('Missing package '+id);
 const block=xml.slice(start,xml.indexOf('</remotePackage>',start));
 const archives=block.match(/<archive>[\s\S]*?<\/archive>/g);
 const archive=archives.find(a=>a.includes('<host-os>windows</host-os>'))||archives.find(a=>!a.includes('<host-os>'));
 const url=archive.match(/<url>([^<]+)/)[1];
 const sum=archive.match(/<checksum[^>]*>([^<]+)/)[1];
 jobs.push(download('https://dl.google.com/android/repository/'+url,name,sum));
}
jobs.push(download('https://github.com/brunodev85/winlator/releases/download/v11.2.0/Winlator_11.2.apk','winlator-11.2.apk'));
Promise.all(jobs).catch(e=>{console.error(e);process.exitCode=1});
