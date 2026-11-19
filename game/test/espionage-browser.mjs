import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
let browser;
try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.host!=='appassets.androidplatform.net'||!url.pathname.startsWith('/game/'))return route.abort();
  const relative=decodeURIComponent(url.pathname.slice(6));if(relative.includes('..'))return route.abort();
  try{const body=await readFile(resolve('work/rebuild-android/assets/game',relative));await route.fulfill({body,contentType:relative.endsWith('.mjs')||relative.endsWith('.js')?'text/javascript':relative.endsWith('.css')?'text/css':relative.endsWith('.svg')?'image/svg+xml':'text/html'});}catch{await route.fulfill({status:404,body:''});}
 });
 await page.addInitScript(()=>{window.AndroidGame={exportSave:(json,name)=>{window.savedExport={json,name};}};});

 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');
 await page.evaluate(async()=>{
  const {createGame,saveGame}=await import('./engine.mjs');const s=createGame(),t=s.nations.france.capital;
  s.nations.france.known.push('7');s.nations.england.projects=[{tech:'7',funding:0,progress:0,investment:0}];
  s.civilians.push({id:'touch-spy',owner:'england',type:'spy',tile:t,order:null});
  localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();await page.locator('[data-panel="civilians"]').tap();
 await page.locator('[data-action="selectCivilian"][data-args*="touch-spy"]').tap();
 await page.getByRole('button',{name:'Spy on province',exact:true}).tap();
 let spy=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).civilians.find(u=>u.id==='touch-spy'));
 assert.equal(spy.order.job,'spy');assert.equal(spy.spyAssignment,undefined);
 await page.evaluate(async()=>{
  const {loadGame,saveGame,finishTurnEconomy}=await import('./engine.mjs');let s=loadGame(localStorage.getItem('imp2-rebuild-v3'));
  s=finishTurnEconomy({...s,turnPhase:'combat'});localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();await page.locator('[data-panel="civilians"]').tap();
 assert.match(await page.locator('#panelBody').innerText(),/active mission/);
 await page.locator('[data-action="selectCivilian"][data-args*="touch-spy"]').tap();
 assert.match(await page.locator('#selection').innerText(),/Garrison: No regiments/);
 await page.screenshot({path:'work/rebuild-v2/phone-spying.png'});
 await page.locator('[data-panel="research"]').tap();
 assert.match(await page.locator('#panelBody').innerText(),/France \(spy assistance\)/);
 await page.screenshot({path:'work/rebuild-v2/phone-research-spy-sources.png'});
 assert.deepEqual(errors,[]);console.log('Packaged Spy touch order, delayed activation, reload and accurate garrison report pass at412x915; Chromium, not Pixel/WebView.');
}finally{await browser?.close();}

