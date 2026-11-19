import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});


await page.evaluate(async()=>{
 const {createGame,command,resolveTurn}=await import('./engine.mjs'),{createMap}=await import('./map.mjs'),{fleetMoves}=await import('./navy.mjs'),{seaKnowledge}=await import('./sea-knowledge.mjs'),{seaDistance,revealCoast}=await import('./overseas.mjs');
 let s=createGame({transportModel:'ports'});const ship=s.ships.find(u=>u.owner===s.player);ship.location='sea49';ship.order=null;ship.sleep=false;s.ships=[ship];s.armies=[];revealCoast(s,s.player,'sea49');
 const hidden=new Set(s.tiles.filter(t=>!s.nations[s.player].revealed.includes(t.id)).map(t=>t.id));
 const coast=s.seas.zones.filter(z=>z.coast.some(id=>hidden.has(id))).sort((a,b)=>seaDistance(s.seas,'sea49',a.id)-seaDistance(s.seas,'sea49',b.id))[0];
 const old=document.querySelector('#map'),canvas=old.cloneNode();old.replaceWith(canvas);const ctx=canvas.getContext('2d'),labels=[],fill=ctx.fillText.bind(ctx);ctx.fillText=(name,x,y,...rest)=>{labels.push({name,x,y});return fill(name,x,y,...rest);};
 let issued=null;const map=createMap(canvas,()=>s,()=>{},{planningFleet:()=>true,selectedShips:()=>[ship.id],reachableSeas:()=>fleetMoves(s,[s.ships[0]]),onSea:zone=>{issued=zone;s=command(s,s.player,{type:'fleet',ships:[ship.id],job:'sail',zone});return true;}});
 window.voyage={next(){const knowledge=seaKnowledge(s);const moves=fleetMoves(s,[s.ships[0]]).filter(m=>knowledge.frontier.has(m.zone)).sort((a,b)=>seaDistance(s.seas,a.zone,coast.id)-seaDistance(s.seas,b.zone,coast.id));if(!moves.length)throw Error('No reachable exploration target');const dest=moves[0].zone;map.focusSea(dest,36);labels.length=0;map.draw();const label=labels.find(l=>l.name.startsWith('Explore'));if(!label)throw Error('No visible exploration target');return {...label,dest};},finish(){if(!issued)throw Error('Map tap failed to issue sailing');const dest=issued;issued=null;s=resolveTurn(s);if(s.ships[0].location!==dest||!s.nations[s.player].seenSea.includes(dest))throw Error('Voyage did not resolve/discover');map.draw();return {destination:dest,discovered:s.nations[s.player].revealed.some(id=>hidden.has(id))};}};
});
let discovered=false;
for(let i=0;i<12&&!discovered;i++){
 const target=await page.evaluate(()=>window.voyage.next());const box=await page.locator('#map').boundingBox();
 if(i===0)await page.screenshot({path:'outputs/visual-review/exploration-targets.png'});
 await page.touchscreen.tap(box.x+target.x,box.y+target.y);
 const result=await page.evaluate(()=>window.voyage.finish());discovered=result.discovered;
}
assert.ok(discovered,'Touch-selected voyages must reveal a hidden New World coast');
await page.screenshot({path:'outputs/visual-review/exploration-voyage.png'});assert.deepEqual(errors,[]);console.log('PASS: map Explore targets issue voyages from Sand Ocean; full turn resolution reveals New World coastline.');
}finally{await browser.close();}
