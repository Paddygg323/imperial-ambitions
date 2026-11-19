import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});


await page.locator('[data-panel=diplomacy]').tap();assert.ok(await page.getByRole('group',{name:'Political world map'}).isVisible());
assert.equal(await page.locator('.selected-country-strip').count(),1);
await page.locator('.country-key').filter({hasText:'Ireland'}).click();assert.match(await page.locator('.favoured-partner').innerText(),/None/);
await page.locator('.atlas-country[aria-label="Select Portugal"]').focus();await page.keyboard.press('Enter');assert.match(await page.locator('.selected-country-strip').innerText(),/Portugal/);
await page.getByRole('button',{name:'Europe',exact:true}).tap();await page.screenshot({path:'outputs/visual-review/diplomacy-europe-phone.png'});
const pendingBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3'))?.declarations??[]);assert.equal(pendingBefore.length,0,'map selection must not issue diplomacy');
await page.setViewportSize({width:1280,height:900});await page.locator('#panelBody').getByRole('button',{name:'World',exact:true}).click();await page.screenshot({path:'outputs/visual-review/diplomacy-world-desktop.png'});
const tribe=await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');const s=createGame({transportModel:'ports'}),p=s.provinces.find(p=>!p.old&&!s.nations[p.owner]);s.nations.england.consulates=['ireland'];s.nations.england.tradePolicies={ireland:75};s.nations.england.revealed.push(...s.tiles.filter(t=>t.province===p.id).map(t=>t.id));localStorage.setItem('imp2-rebuild-v3',saveGame(s));return p.owner;});
await page.reload();await page.locator('[data-panel=diplomacy]').click();await page.locator('.country-key').filter({hasText:'Ireland'}).click();assert.match(await page.locator('.favoured-partner').innerText(),/England/);await page.locator('.country-key').filter({has:page.locator('small',{hasText:'Independent'})}).first().click();
await page.locator('.diplomacy-tools').getByRole('button',{name:'Information',exact:true}).click();assert.match(await page.locator('.selected-country-strip').innerText(),/No declaration needed/);assert.equal(await page.locator('.selected-country-strip [data-action=declareWar]').count(),0);
assert.deepEqual(errors,[]);console.log('PASS: political map keyboard selection, regional views, single-country dossier and independent New World attack guidance.');
}finally{await browser.close();}
