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
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');
 const terminal=JSON.parse(await readFile('work/rebuild-v2/native-map-campaign-save.json','utf8'));
 assert.deepEqual(terminal.outcome,{status:'defeat',reason:'capitalLost',nation:'england',attacker:'sweden',province:'e1-0',turn:190});
 await page.evaluate(value=>localStorage.setItem('imp2-rebuild-v3',value),JSON.stringify(terminal));await page.reload();
 assert.match(await page.locator('#heading').innerText(),/Defeat/);assert.ok(await page.locator('#endTurn').isDisabled());
 await page.locator('[data-panel="reports"]').tap();assert.match(await page.locator('#panelBody').innerText(),/england has been eliminated after losing its capital/i);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'work/rebuild-v2/phone-native-map-defeat.png'});await page.reload();assert.ok(await page.locator('#endTurn').isDisabled());
 assert.deepEqual(errors,[]);console.log('Actual fresh-campaign defeat save loads at phone viewport, reports capital loss, disables End Turn and persists across reload. Chromium, not Pixel/WebView.');
}finally{await browser?.close();}
