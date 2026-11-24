import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const roots={preview:dirname(fileURLToPath(import.meta.url)),game:resolve('game')};
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname),isGame=pathname.startsWith('/game/'),root=isGame?roots.game:roots.preview;
  const rel=isGame?pathname.slice(6):pathname==='/'?'index.html':pathname.slice(1),file=resolve(root,rel);
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(8794,'127.0.0.1',()=>console.log('Design previews: http://127.0.0.1:8794/'));
