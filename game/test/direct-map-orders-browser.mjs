import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});


// Actual touch click on an adjacent resource issues the engineer's road order.
await page.locator('[data-panel=civilians]').tap();await page.locator('.civilian-row').filter({hasText:'Engineer'}).getByRole('button',{name:'Select',exact:true}).tap();
const road=await page.evaluate(async()=>{const {createGame}=await import('./engine.mjs'),{neighbourIds}=await import('./world.mjs'),{transportLink}=await import('./transport-links.mjs');const s=createGame({transportModel:'ports'}),u=s.civilians.find(c=>c.owner==='england'&&c.type==='engineer'),from=s.tiles.find(t=>t.id===u.tile),to=s.tiles.find(t=>t.owner==='england'&&neighbourIds(from).includes(t.id)&&!transportLink(s,from,t)&&!s.civilians.some(c=>c.tile===t.id));return {dx:to.x+(to.y%2)*.5-from.x-(from.y%2)*.5,dy:(to.y-from.y)*.866,id:u.id,tile:to.id};});
let box=await page.locator('#map').boundingBox();await page.touchscreen.tap(box.x+box.width/2+road.dx*78,box.y+box.height/2+road.dy*78);
assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).civilians.find(u=>u.id===id).order?.job,road.id),'road');
assert.match(await page.locator('#orderReceipt').innerText(),/Road ordered/);await page.locator('#orderReceipt').getByRole('button',{name:'Undo',exact:true}).click();assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).civilians.find(u=>u.id===id).order,road.id),null);assert.equal(await page.locator('#orderReceipt').isVisible(),false);
// Research phase handling is explicit and navigates back to the pending market.
await page.evaluate(async()=>{const {createGame,saveGame,beginTurn}=await import('./engine.mjs');let s=createGame({transportModel:'ports'});s=beginTurn(s);localStorage.setItem('imp2-rebuild-v3',saveGame(s));});
await page.reload();assert.equal(await page.locator('#panelBody').getAttribute('data-view'),'trade');assert.ok(await page.locator('#closePanel').isHidden());await page.keyboard.press('Escape');assert.equal(await page.locator('#panel').evaluate(e=>e.open),true);assert.equal(await page.locator('#panelBody').getAttribute('data-view'),'trade');
// Exercise the exact Java-host Back script against a pending market.
const host=await readFile('android/src/main/java/com/paddy/imperialism/rebuild/MainActivity.java','utf8'),backScript=host.match(/game\.evaluateJavascript\("([^"\n]+)",closed/)[1];
assert.equal(await page.evaluate(backScript),false,'blocked market requests the native Leave/Stay prompt');assert.equal(await page.locator('#panel').evaluate(e=>e.open),true,'Android Back must honour the market cancel guard');
// Finish offers and verify the map becomes available only after resolution.
await page.evaluate(async()=>{const {loadGame,saveGame,command}=await import('./engine.mjs');let s=loadGame(localStorage.getItem('imp2-rebuild-v3'));for(let i=0;s.market&&!s.market.complete&&i<100;i++)s=command(s,{type:'advanceMarket'});localStorage.setItem('imp2-rebuild-v3',saveGame(s));});await page.reload();await page.getByRole('button',{name:'Continue turn',exact:true}).click();assert.ok(await page.evaluate(()=>!JSON.parse(localStorage.getItem('imp2-rebuild-v3')).market));await page.locator('#closePanel').click();assert.equal(await page.locator('#panel').evaluate(e=>e.open),false);
// Nearby independent target fixture: no war declaration and no menu required.
await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');const s=createGame({transportModel:'ports'}),home=s.tiles.find(t=>t.id===s.nations.england.capital),target=s.provinces.find(p=>p.name==='Kent');target.owner='scotland';target.old=false;target.investors=[];for(const t of s.tiles.filter(t=>t.province===target.id)){t.owner='scotland';s.nations.england.revealed.push(t.id);}s.armies=[{id:'map-attacker',owner:'england',province:home.province,type:'pikeman',hp:100,experience:0,defending:true,order:null}];localStorage.setItem('imp2-rebuild-v3',saveGame(s));});
await page.setViewportSize({width:1280,height:900});await page.reload();await page.locator('#home').click();
box=await page.locator('#map').boundingBox();await page.mouse.click(box.x+box.width/2-Math.max(46,78*.85),box.y+box.height/2+Math.max(42,78*.78)-8);
assert.match(await page.locator('#selection').innerText(),/regiments selected/);assert.equal(await page.locator('#panel').evaluate(e=>e.open),false);
const target=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('imp2-rebuild-v3')),home=s.tiles.find(t=>t.id===s.nations.england.capital),p=s.provinces.find(p=>p.name==='Kent'),t=s.tiles.find(t=>t.id===p.town);return {id:p.id,dx:t.x+(t.y%2)*.5-home.x-(home.y%2)*.5,dy:(t.y-home.y)*.866};});
await page.waitForTimeout(250);box=await page.locator('#map').boundingBox();await page.mouse.click(box.x+box.width/2+target.dx*78,box.y+box.height/2+target.dy*78);
await page.waitForFunction(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).armies[0].order?.job==='attack',null,{timeout:10000});assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).armies[0].order?.job),'attack');
await page.screenshot({path:'outputs/visual-review/refresh238-attack-receipt.png'});assert.match(await page.locator('#orderReceipt').innerText(),/Attack ordered/);
// Queue jumps to the explorer; centre on London again without altering the order.
await page.waitForTimeout(150);await page.locator('#home').click();box=await page.locator('#map').boundingBox();
const mx=box.x+box.width/2+target.dx*78,my=box.y+box.height/2+target.dy*78;
await page.screenshot({path:'outputs/visual-review/army-attack-arrow.png'});await page.mouse.click(mx,my);
assert.ok(await page.getByRole('button',{name:'Rescind orders',exact:true}).isVisible());await page.getByRole('button',{name:'Rescind orders',exact:true}).click();
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).armies[0].order),null);
assert.deepEqual(errors,[]);console.log('PASS: one-click engineer road, end-of-turn trade navigation lock, tent-to-province attack, clickable troop arrow and rescind.');
}finally{await browser.close();}


