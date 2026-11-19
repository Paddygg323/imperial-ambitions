import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=resolve('game');
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'),file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
 if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{const body=await readFile(file);res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(body);}catch{res.writeHead(404).end();}
});
let browser;
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const url=`http://127.0.0.1:${server.address().port}/`;
 await page.goto(url);
 await page.evaluate(async()=>{
  await navigator.serviceWorker.register('./sw.js');
  await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Service worker did not become ready within 20 seconds')),20000))]);
 });
 // Prove installation itself cached the new dependencies; do not rely on
 // previously fetched modules having been captured by a fetch event.
 const keys=await page.evaluate(async()=>{const names=(await caches.keys()).filter(n=>n.startsWith('imperialism-rebuild-'));if(names.length!==1)throw Error('Expected one installed game cache');const cache=await caches.open(names[0]);return (await cache.keys()).map(r=>new URL(r.url).pathname);});
 for(const name of ['minor-join-offers','minor-join-acceptance','campaign-deal-price','colony-trade-policy','colony-first-refusal','heraldry','diplomacy-screen','diplomatic-aid','power-rankings','research-screen'])assert.ok(keys.includes('/'+name+'.mjs'));
 for(const name of ['royal-regiments.png','royal-meadow.png','royal-ocean.png','royal-desert.png','royal-ground.png','royal-biomes.png','royal-towns.png','towns-forts.png','rural-landscape.png'])assert.ok(keys.includes('/assets/'+name),'New artwork missing from offline cache: '+name);
 for(const name of ['254-grass.png','254-sheep.png','253-tin.png','253-copper.png','253-iron.png','253-coal.png','253-swamp.png'])assert.ok(keys.includes('/assets/reviewed/'+name),'New reviewed sprite missing from offline cache: '+name);
 await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await context.setOffline(true);await page.reload();await page.locator('#menu').tap();
 assert.equal(await page.locator('[data-action="export"]').count(),1);
 await page.locator('#closePanel').click();await page.locator('[data-panel=diplomacy]').click();assert.equal(await page.locator('.diplomacy-tools').count(),1);await page.getByRole('button',{name:'Power rankings',exact:true}).click();assert.equal(await page.locator('.ranking-chart').count(),8);await page.locator('#closePanel').click();await page.locator('[data-panel=research]').click();assert.equal(await page.locator('.research-categories button').count(),6);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 console.log('Installed service worker, confirmed new runtime dependencies in precache, reloaded offline and opened save menu at 412x915 without page errors. Desktop Chromium, not Pixel.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}



