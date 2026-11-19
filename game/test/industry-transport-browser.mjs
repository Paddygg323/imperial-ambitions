import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});


await page.locator('[data-panel=industry]').tap();
assert.ok(await page.locator('.workshop svg image').count()>=9);
await page.getByRole('button',{name:'Workers',exact:true}).tap();
assert.equal(await page.locator('.recruit-card svg image').count(),4);
await page.screenshot({path:'outputs/visual-review/workers.png'});
await page.getByRole('button',{name:'Recruitment',exact:true}).tap();
assert.ok(await page.locator('.recruit-card .military-portrait').count()>0);
await page.screenshot({path:'outputs/visual-review/recruitment.png'});
await page.getByRole('button',{name:'Spare labour: automatic',exact:true}).tap();
assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem('imp2-rebuild-v3'))).nations.england.autoProduction,false);
await page.reload();await page.locator('[data-panel=industry]').tap();assert.ok(await page.getByRole('button',{name:'Spare labour: manual',exact:true}).isVisible());
// Isolated remote-port fixture; exercise the actual range control and persistent allocation.
await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs'),{conquerProvince}=await import('./conquest.mjs');const s=createGame({transportModel:'ports'}),remote=s.nations.france.capital;conquerProvince(s,s.tiles.find(t=>t.id===remote).province,'england');for(const t of s.tiles)t.level=0;const t=s.tiles.find(t=>t.id===remote);t.resource='timber';t.level=4;t.prospected=true;localStorage.setItem('imp2-rebuild-v3',saveGame(s));});
await page.reload();await page.locator('[data-panel=transport]').tap();
const slider=page.getByRole('slider',{name:'Timber sea cargo',exact:true});assert.ok(await slider.isEnabled());
await slider.focus();await slider.press('Home');await slider.press('ArrowRight');
const allocation=await page.evaluate(async()=>{const {transport}=await import('./engine.mjs');return transport(JSON.parse(localStorage.getItem('imp2-rebuild-v3')),'england').allocations.timber;});assert.equal(allocation,1);
await page.screenshot({path:'outputs/visual-review/transport-allocated.png'});
await page.reload();await page.locator('[data-panel=transport]').tap();assert.equal(await page.getByRole('slider',{name:'Timber sea cargo',exact:true}).inputValue(),'1');
await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');const s=createGame({transportModel:'ports'});s.nations.england.stock.timber=0;s.nations.england.orders.production.lumber=2;localStorage.setItem('imp2-rebuild-v3',saveGame(s));});
await page.reload();await page.locator('[data-panel=industry]').tap();
const lumber=page.locator('.workshop').filter({has:page.locator('.workshop-info > b',{hasText:'Lumber'})});
await lumber.getByRole('button',{name:'−',exact:true}).tap();
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).nations.england.orders.production.lumber),1);
await lumber.getByRole('button',{name:'−',exact:true}).tap();
await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).nations.england.orders.production.lumber),0);
await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');const s=createGame({transportModel:'ports'});s.nations.england.stock.wool=0;s.nations.england.stock.iron=2;s.nations.england.orders.production.woolFabric=1;localStorage.setItem('imp2-rebuild-v3',saveGame(s));});
await page.reload();await page.locator('[data-panel=industry]').tap();
await page.locator('.workshop').filter({has:page.locator('.workshop-info > b',{hasText:'Cast Iron'})}).getByRole('button',{name:'+',exact:true}).tap();
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).nations.england.orders.production.castIron),1);
await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).nations.england.orders.production.castIron),1);
assert.deepEqual(errors,[]);console.log('PASS: illustrated production/workers/army recruitment, automatic labour preference persists, transport slider allocates actual cargo and survives reload.');
}finally{await browser.close();}
