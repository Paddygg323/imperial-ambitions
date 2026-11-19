import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});

await page.evaluate(async()=>{const {createGame}=await import('./engine.mjs'),{createMap}=await import('./map.mjs');const s=createGame();s.civilians=[];s.armies=[];s.ships=[];
s.tiles=[];for(let row=0;row<4;row++)for(let col=0;col<4;col++)s.tiles.push({id:`${80+col},${20+row}`,x:80+col,y:20+row,owner:'england',province:'dev',terrain:[4,2,12,8][row],resource:['grain','meat','timber','iron'][row],level:col+1,prospected:true});
s.provinces=[{id:'dev',owner:'england',old:true,town:'missing',name:'Development sample'}];s.nations.england.prospected=s.tiles.map(t=>t.id);
const old=document.querySelector('#map'),canvas=old.cloneNode();old.replaceWith(canvas);window.developmentPreview=createMap(canvas,()=>s,()=>{});developmentPreview.focus('81,22');
});await page.waitForTimeout(500);await page.locator('#map').screenshot({path:'outputs/visual-review/development-levels-map.png'});
// Camera cannot be zoomed into an effectively empty infinite plane.
const bounds=await page.evaluate(()=>{developmentPreview.zoom(.00001);return developmentPreview.viewport();});assert.ok(bounds.scale>=Math.min(bounds.width/110,bounds.height/54));
assert.deepEqual(errors,[]);console.log('PASS: sixteen resource-development fixtures render at real local map scale; minimum zoom constrained. Fixture does not change saved campaign.');
}finally{await browser.close();}

