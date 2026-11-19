import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const root=resolve('game');
const server=createServer(async(req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{const body=await readFile(file);res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(body);}catch{res.writeHead(404).end();}
});
let browser;
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
 const page=await browser.newPage({viewport:{width:1448,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.locator('#startupStatus').waitFor({state:'detached'});
 const result=await page.evaluate(async()=>{
  const {SPRITES}=await import('./reviewed-sprite-data.mjs');
  const {createReviewedSprites}=await import('./reviewed-sprites.mjs');
  const r=createReviewedSprites(()=>{});await r.ready;return {loaded:r.tiles.size,expected:Object.keys(SPRITES).length,errors:r.errors};
 });
 assert.equal(result.loaded,result.expected);assert.deepEqual(result.errors,[]);
 await mkdir('work/handoff-smoke',{recursive:true});
 await page.screenshot({path:'work/handoff-smoke/desktop.png'});
 await page.setViewportSize({width:412,height:915});await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'work/handoff-smoke/phone.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS: game starts; '+result.loaded+' sprite mappings load; desktop/phone layouts; no page errors.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
