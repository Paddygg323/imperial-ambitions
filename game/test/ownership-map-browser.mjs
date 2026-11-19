import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});



await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');const s=createGame({transportModel:'ports'}),p=s.provinces.find(p=>p.name==='Cherokee');if(!p)throw Error('No Cherokee fixture');p.owner='england';for(const t of s.tiles.filter(t=>t.province===p.id))t.owner='england';s.nations.england.revealed=s.tiles.map(t=>t.id);s.civilians=s.civilians.filter(u=>u.owner==='england'&&u.type==='explorer');s.civilians[0].tile=p.town;s.armies=[];s.ships=[];localStorage.setItem('imp2-rebuild-v3',saveGame(s));});
await page.reload();await page.locator('[data-panel=civilians]').tap();await page.locator('.civilian-row').getByRole('button',{name:'Select',exact:true}).tap();await page.waitForTimeout(300);await page.screenshot({path:'outputs/visual-review/cherokee-ownership-phone.png'});assert.deepEqual(errors,[]);console.log('PASS: conquered Cherokee ownership map renders without browser errors.');
}finally{await browser.close();}

