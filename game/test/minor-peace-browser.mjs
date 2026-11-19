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
 await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');const s=createGame();s.wars=[['england','scotland']];localStorage.setItem('imp2-rebuild-v3',saveGame(s));});
 await page.reload();await page.locator('[data-panel="diplomacy"]').tap();
 const offer=async()=>{await page.getByRole('button',{name:'Treaties',exact:true}).tap();await page.getByRole('button',{name:'Peace treaty',exact:true}).tap();await page.locator('.country-key').filter({hasText:'Scotland'}).tap();};
 await offer();
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).peaceOffers),[{nation:'england',target:'scotland'}]);
 await page.reload();await page.locator('[data-panel="diplomacy"]').tap();
 await page.locator('.country-key').filter({hasText:'Scotland'}).tap();
 await page.getByRole('button',{name:'Rescind peace offer',exact:true}).tap();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).peaceOffers.length),0);
 await offer();
 await page.locator('.selected-country-strip').scrollIntoViewIfNeeded();await page.screenshot({path:'work/rebuild-v2/phone-minor-peace.png'});
 await page.locator('#closePanel').tap();await page.locator('#endTurn').tap();await page.getByRole('button',{name:'Resolve turn',exact:true}).tap();
 await page.waitForFunction(()=>!JSON.parse(localStorage.getItem('imp2-rebuild-v3')).wars.some(w=>w.includes('england')&&w.includes('scotland')));
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 assert.ok([...(saved.market?.diplomacy??[]),...saved.reports].some(r=>r.peace&&r.nation==='england'));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('Packaged phone touch peace offer, cancel, reload, re-offer and diplomacy settlement pass for Scotland. Chromium only.');
}finally{await browser?.close();}
