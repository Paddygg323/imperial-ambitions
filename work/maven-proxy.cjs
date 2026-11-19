const http=require('http'),fs=require('fs'),path=require('path');
const {Readable}=require('stream'),{pipeline}=require('stream/promises');
const root=path.resolve('work/maven-cache');fs.mkdirSync(root,{recursive:true});
const origins={google:'https://dl.google.com/dl/android/maven2/',central:'https://repo.maven.apache.org/maven2/'};
const pending=new Map();
http.createServer(async(req,res)=>{
 try {
  const u=new URL(req.url,'http://127.0.0.1'),parts=u.pathname.split('/').filter(Boolean);
  const origin=origins[parts.shift()];if(!origin || !['GET','HEAD'].includes(req.method)) {res.writeHead(400).end();return;}
  const key=u.pathname.substring(1),dest=path.resolve(root,key);
  if(!dest.startsWith(root+path.sep)){res.writeHead(400).end();return;}
  if(!fs.existsSync(dest)) {
   if(!pending.has(key)) pending.set(key,(async()=>{
    const url=origin+parts.join('/');let upstream;
    for(let attempt=0;attempt<3;attempt++) {try {upstream=await fetch(url);break;}catch(e){if(attempt===2)throw e;}}
    if(!upstream.ok) {let e=new Error('HTTP '+upstream.status);e.status=upstream.status;throw e;}
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    await pipeline(Readable.fromWeb(upstream.body),fs.createWriteStream(dest+'.part'));
    fs.renameSync(dest+'.part',dest);
   })().finally(()=>pending.delete(key)));
   await pending.get(key);
  }
  res.writeHead(200,{'Content-Length':fs.statSync(dest).size});
  if(req.method==='HEAD')res.end();else fs.createReadStream(dest).pipe(res);
 }catch(e){res.writeHead(e.status||502).end(e.message);if(!e.status || e.status!==404)console.log(req.url+': '+e.message);}
}).listen(18764,'127.0.0.1',()=>console.log('Build-only Maven cache listening on loopback port 18764'));
