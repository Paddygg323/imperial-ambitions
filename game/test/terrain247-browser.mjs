import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const out='outputs/visual-review/terrain247';await mkdir(out,{recursive:true});
try{const page=await browser.newPage({viewport:{width:1448,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async r=>{const file=resolve('game',new URL(r.request().url()).pathname.slice(6));try{await r.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await r.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.locator('#startupStatus').waitFor({state:'detached'});
await page.evaluate(async()=>{const {createMap}=await import('./map.mjs');const {createGame}=await import('./engine.mjs');const s=createGame(),capital=s.tiles.find(t=>t.id===s.nations[s.player].capital);for(const t of s.tiles){if(t.owner===s.player&&t.terrain!==13){t.terrain=((t.x%6)+Math.floor(t.y/2)%3*6);t.resource=null;t.level=0;}}const old=document.querySelector('#map'),canvas=old.cloneNode();old.replaceWith(canvas);window.fixture=s;window.before=JSON.stringify(s);window.testMap=createMap(canvas,()=>s,()=>{});window.testMap.focus(capital.id);});
await page.waitForTimeout(600);await page.screenshot({path:out+'/local.png'});
await page.evaluate(()=>window.testMap.fitNation());await page.screenshot({path:out+'/nation.png'});
await page.setViewportSize({width:412,height:915});await page.evaluate(()=>window.testMap.focus(window.fixture.nations[window.fixture.player].capital));await page.waitForTimeout(300);await page.screenshot({path:out+'/phone.png'});
assert.ok(await page.evaluate(()=>JSON.stringify(window.fixture)===window.before));assert.deepEqual(errors,[]);console.log('PASS all-terrain renderer local/nation/phone; fixture state unchanged; no JS errors. Synthetic terrain fixture, not user campaign.');
}finally{await browser.close();}

