// Stable play/save origin. Only the public, generated game build is fetched.
// No GitHub credential is deployed and no browser cookies/auth are forwarded.
const UPSTREAM='https://paddygg323.github.io/imperial-ambitions-web/';
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.woff':'font/woff','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
export async function serveGame(request,fetcher=fetch){
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 let path;try{path=decodeURIComponent(new URL(request.url).pathname);}catch{return new Response('Bad path',{status:400});}
 if(path==='/')path='/index.html';
 if(path.includes('\\')||path.split('/').some(p=>p==='..'||p.startsWith('.')))return new Response('Not found',{status:404});
 const extension=path.slice(path.lastIndexOf('.')).toLowerCase();
 if(!TYPES[extension])return new Response('Not found',{status:404});
 const upstream=UPSTREAM+path.slice(1);
 try{
  const response=await fetcher(upstream,{method:request.method,redirect:'follow',cache:'no-store'});
  const headers=new Headers({'Content-Type':TYPES[extension],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','X-Game-Source':'github-main'});
  return new Response(request.method==='HEAD'?null:response.body,{status:response.status,headers});
 }catch{return new Response('The game update server is temporarily unavailable. Your saved campaign has not been changed.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});}
}
export default {fetch(request){return serveGame(request);}};
