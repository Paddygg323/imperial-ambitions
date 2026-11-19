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
 await page.screenshot({path:'work/rebuild-v2/native-map-home.png'});
 await page.locator('#strategic').tap();await page.screenshot({path:'work/rebuild-v2/native-map-world.png'});
 assert.deepEqual(errors,[]);
}finally{await browser?.close();}
