import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:Number(process.env.IMP_TEST_WIDTH??412),height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});

await page.locator('[data-panel=civilians]').tap();await page.locator('.civilian-row').filter({hasText:'Engineer'}).getByRole('button',{name:'Select',exact:true}).tap();
const box=await page.locator('#map').boundingBox();
// London engineer is at82,23;81,22 is two steps away, not a legal road edge.
await page.touchscreen.tap(box.x+box.width/2-81,box.y+box.height/2-54*.866);
assert.equal(await page.getByRole('button',{name:'Build road',exact:true}).isEnabled(),false);
assert.match(await page.locator('#selection').innerText(),/neighbouring tile/);
const target=await page.evaluate(async()=>{const {createGame}=await import('./engine.mjs'),{neighbourIds}=await import('./world.mjs'),{transportLink}=await import('./transport-links.mjs');const s=createGame({transportModel:'ports'}),u=s.civilians.find(c=>c.owner==='england'&&c.type==='engineer'),from=s.tiles.find(t=>t.id===u.tile);return s.tiles.find(t=>t.owner==='england'&&t.y>from.y&&neighbourIds(from).includes(t.id)&&!transportLink(s,from,t));});
assert.ok(target);await page.touchscreen.tap(box.x+box.width/2+(target.x+(target.y%2)*.5-82.5)*54,box.y+box.height/2+(target.y-23)*54*.866);
const road=page.getByRole('button',{name:'Build road',exact:true});assert.ok(await road.isEnabled());
// Button must be in the selection viewport, not hidden below the tile-detail scroll.
assert.ok(await road.evaluate(e=>{const b=e.getBoundingClientRect(),p=document.querySelector('#selection').getBoundingClientRect();return b.top>=p.top&&b.bottom<=p.bottom;}));await road.tap();
const saved=await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3'));assert.equal(JSON.parse(saved).civilians.find(c=>c.owner==='england'&&c.type==='engineer').order.job,'road');
const pixels=()=>page.locator('#map').evaluate(c=>c.toDataURL());const first=await pixels();await page.waitForTimeout(280);assert.notEqual(await pixels(),first,'Working civilian must visibly animate');assert.equal(await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3')),saved,'Animation must not advance orders or mutate save');
await page.screenshot({path:'outputs/visual-review/civilian-working.png'});
await page.getByRole('button',{name:'Deselect civilian',exact:true}).tap();assert.equal(await page.locator('#selection').getByRole('button',{name:'Build road',exact:true}).count(),0);assert.equal(await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3')),saved,'Deselecting must not cancel the order');
await page.locator('[data-panel=civilians]').tap();await page.locator('.civilian-row').filter({hasText:'Engineer'}).getByRole('button',{name:'Select',exact:true}).tap();
await page.getByRole('button',{name:'Cancel order',exact:true}).tap();await page.waitForTimeout(200);const idle=await pixels();await page.waitForTimeout(280);assert.equal(await pixels(),idle,'Idle civilian must stop work animation');
assert.deepEqual(errors,[]);console.log('PASS: nonadjacent road blocked with explanation; adjacent touch order saves; action visible; busy animation changes pixels without changing save; cancellation stops motion.');
}finally{await browser.close();}
