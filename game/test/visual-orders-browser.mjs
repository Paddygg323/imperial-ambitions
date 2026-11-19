import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});

const saved=()=>page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3'));
const before=await saved();
await page.locator('#mapOnly').tap();assert.ok(await page.locator('body').evaluate(e=>e.classList.contains('map-only')));
assert.ok((await page.locator('#map').boundingBox()).height>=900);
await page.touchscreen.tap(200,400);assert.ok(!await page.locator('body').evaluate(e=>e.classList.contains('map-only')));assert.equal(await saved(),before);
// Direct tap on the Thames sea exit, relative to London at local focus.
let box=await page.locator('#map').boundingBox();
await page.touchscreen.tap(box.x+box.width/2+108,box.y+box.height/2-2*54*.866);
assert.equal(await page.locator('#panelTitle').innerText(),'Choose ships to sail');
const shipButtons=page.locator('[data-action=selectShip]');assert.ok(await shipButtons.count()>1);
assert.equal(await shipButtons.count(),await page.locator('[data-action=selectShip][aria-pressed=true]').count(),'Opening touch does not accidentally deselect a ship');
const leftBehind=JSON.parse(await shipButtons.first().getAttribute('data-args')).id;
await shipButtons.first().tap();
assert.equal(await shipButtons.first().getAttribute('aria-pressed'),'false');
await page.screenshot({path:'outputs/visual-review/fleet-picker.png'});
await page.locator('[data-action=planFleet]').tap();
assert.equal(await page.locator('#panel').evaluate(e=>e.open),false);
assert.equal(await saved(),before,'Selecting ships and entering destination mode issues no orders');
// Home camera gives a reproducible nearby sea target; choose the home exit sea.
await page.locator('#home').tap();box=await page.locator('#map').boundingBox();
await page.touchscreen.tap(box.x+box.width/2+108,box.y+box.height/2-2*54*.866);
assert.equal(await page.locator('#panel').evaluate(e=>e.open),false,'Destination tap gives the order without reopening a dialog');
const after=JSON.parse(await saved());assert.ok(after.ships.filter(s=>s.owner==='england'&&s.id!==leftBehind).every(s=>s.order?.job==='sail'));
assert.ok(!after.ships.find(s=>s.id===leftBehind).order,'Deselected ship stays behind');
await page.screenshot({path:'outputs/visual-review/fleet-orders.png'});
// Destination marker is selectable immediately although the simulation remains at home.
assert.ok(after.ships.filter(s=>s.owner==='england').every(s=>s.location==='home'));
box=await page.locator('#map').boundingBox();
await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
assert.equal(await page.locator('#panelTitle').innerText(),'Choose ships to sail');
assert.equal(await page.locator('[data-action=selectShip]').count(),after.ships.filter(s=>s.owner==='england'&&s.id!==leftBehind).length);
await page.getByRole('button',{name:'Cancel selected missions',exact:true}).tap();
assert.equal(await page.locator('#panel').evaluate(e=>e.open),false);
const cancelled=JSON.parse(await saved());assert.ok(cancelled.ships.filter(s=>s.owner==='england').every(s=>!s.order&&s.location==='home'));
await page.locator('[data-panel=research]').tap();
const cards=await page.locator('.technology-card').count();assert.ok(cards>=8);
assert.ok(await page.locator('.technology-card').first().getByRole('button',{name:'Research',exact:true}).isEnabled());
await page.locator('.technology-card').first().locator('summary').tap();assert.match(await page.locator('.technology-card').first().innerText(),/Requires:/);
// Foreign knowledge uses actual countries, excludes our own, and leaves research controls usable.
await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('imp2-rebuild-v3'));s.nations.france.known.push('7');localStorage.setItem('imp2-rebuild-v3',JSON.stringify(s));});
await page.reload();await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));
await page.locator('[data-panel=research]').tap();
const mine=page.locator('.technology-card').filter({hasText:'Mine Engineering'});assert.ok(await mine.locator('.knowledge-flag[aria-label^="France"]').count());assert.equal(await mine.locator('.knowledge-flag[aria-label^="England"]').count(),0);
await mine.locator('.knowledge-flags').tap();assert.match(await page.locator('#toast').innerText(),/Known abroad:.*France/);
await mine.getByRole('button',{name:'Research',exact:true}).tap();
assert.ok(JSON.parse(await saved()).nations.england.projects.some(p=>p.tech==='7'));
await page.screenshot({path:'outputs/visual-review/research-active-flags.png'});
assert.deepEqual(errors,[]);console.log('PASS: map-only restoration preserves save; fleet group tap, subset selection and direct destination sailing order; deselected ship stays behind; research prerequisites retained.');
}finally{await browser.close();}


