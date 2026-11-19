import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});


const target=await page.evaluate(async()=>{
 const {createGame,saveGame}=await import('./engine.mjs'),{fleetMapTarget}=await import('./fleet-map-target.mjs');const s=createGame({transportModel:'ports'}),ship=s.ships.find(u=>u.owner==='england');s.ships=[ship];for(const c of s.civilians)c.sleep=true;for(const a of s.armies)a.defending=true;
 let target=null;for(const z of s.seas.zones){const [x,y]=z.center.split(',').map(Number);if(x<18||x>55||y<12||y>42)continue;for(const id of z.coast){const tile=s.tiles.find(t=>t.id===id),p=s.provinces.find(p=>p.id===tile.province);if(p.old)continue;const dx=tile.x+(tile.y%2)*.5-(x+(y%2)*.5),dy=(tile.y-y)*.866;if(Math.abs(dx)>4.5||Math.abs(dy)>5)continue;ship.location=z.id;ship.order=null;ship.sleep=false;s.nations.england.revealed.push(...z.coast);if(fleetMapTarget(s,[ship.id],id).valid){target={tile:id,province:p.id,dx,dy,ship:ship.id,turn:s.turn};break;}}if(target)break;}
 if(!target)throw Error('No suitable coast fixture');localStorage.setItem('imp2-rebuild-v3',saveGame(s));return target;
});
await page.reload();await page.waitForFunction(()=>document.querySelector('#selection').innerText.includes('ready to sail'));
assert.equal(await page.locator('#panel').evaluate(e=>e.open),false);
await page.evaluate(()=>{const ctx=document.querySelector('#map').getContext('2d'),fill=ctx.fillText.bind(ctx);window.hoverLabels=[];ctx.fillText=(text,...args)=>{window.hoverLabels.push(text);return fill(text,...args);};});
const box=await page.locator('#map').boundingBox(),x=box.x+box.width/2+target.dx*36,y=box.y+box.height/2+target.dy*36;
await page.mouse.move(x,y);await page.waitForTimeout(120);
assert.ok(await page.evaluate(()=>window.hoverLabels.some(t=>t.startsWith('Establish beachhead:'))),'hover explains valid beachhead');
await page.screenshot({path:'outputs/visual-review/beachhead-hover.png'});
await page.touchscreen.tap(x,y);
const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3'))),ship=saved.ships.find(s=>s.id===target.ship);
assert.equal(ship.order.job,'beachhead');assert.equal(ship.order.province,target.province);assert.equal(ship.order.readyTurn,target.turn+1);
await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).ships[0].order.job),'beachhead');
assert.deepEqual(errors,[]);console.log('PASS: hover identifies coastal province, direct touch issues beachhead, preparation turn and saved order preserved.');
}finally{await browser.close();}
