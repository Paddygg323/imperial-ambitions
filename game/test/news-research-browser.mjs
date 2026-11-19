import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{const u=new URL(route.request().url());try{const file=resolve('game',u.pathname.slice(6));const body=await readFile(file);await route.fulfill({body,contentType:file.endsWith('.png')?'image/png':file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');await page.waitForFunction(()=>document.querySelector('#heading').textContent.includes('1500'));await page.waitForTimeout(600);await mkdir('outputs/visual-review',{recursive:true});



await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');const s=createGame({transportModel:'ports'});s.reports=[{nation:'england',kind:'army',recovered:20,text:'pikeman recovered health'},{nation:'england',kind:'civilian',text:'Builder developed a tile'},{nation:'france',kind:'diplomacy',allianceAccepted:true,text:'France accepted an alliance with Spain.'},{nation:'england',kind:'battle',text:'Enemy attack repelled at London.'},{nation:'england',kind:'production',recipe:'lumber',made:2,requested:2,labour:4},{nation:'england',kind:'research',completed:true,text:'Completed discovery.'}];localStorage.setItem('imp2-rebuild-v3',saveGame(s));});await page.reload();
await page.locator('[data-panel=reports]').tap();assert.match(await page.locator('.research-alert').innerText(),/Researchers are idle/);assert.equal(await page.locator('.routine-news').getAttribute('open'),null);assert.match(await page.locator('.news-item').allTextContents().then(a=>a.join(' ')),/Enemy attack/);assert.match(await page.locator('.news-item').allTextContents().then(a=>a.join(' ')),/France accepted/);assert.ok(!/recovered|Builder developed/.test(await page.locator('.news-item').allTextContents().then(a=>a.join(' '))));await page.screenshot({path:'outputs/visual-review/news-research-alert.png'});
await page.getByRole('button',{name:'Open research',exact:true}).tap();const first=page.locator('[data-action=startResearch]:enabled').first(),args=JSON.parse(await first.getAttribute('data-args'));await first.tap();
const project=await page.evaluate(tech=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).nations.england.projects.find(p=>p.tech===tech),args.tech);assert.ok(project.funding>0);assert.match(await page.locator('.research-project').innerText(),new RegExp('\\$'+project.funding+'\\s*per turn'));await page.screenshot({path:'outputs/visual-review/research-base-funding.png'});
await page.locator('#closePanel').tap();await page.locator('#endTurn').tap();assert.match(await page.locator('.research-alert').innerText(),/2 of 3/);assert.deepEqual(errors,[]);console.log('PASS: prominent idle warning, routine news collapsed, research shortcut, default funded project, end-turn warning.');
}finally{await browser.close();}
