const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'};
function createStaticServer({root,project}) {
 root=path.resolve(root);
 return http.createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  try{
   const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(name==='/__project'){
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(req.method==='HEAD'?undefined:JSON.stringify({project,sourceRoot:root}));return;
   }
   const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
   if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
   const body=fs.readFileSync(file);
   res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
   res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(404).end('Not found');}
 });
}
module.exports={createStaticServer};
