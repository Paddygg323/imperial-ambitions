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
  const {createGame,saveGame}=await import('./engine.mjs');const s=createGame({transportModel:'ports'});
  s.wars=[['england','france']];s.nations.france.warSupport=Math.fround(.0001);
  localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();await page.locator('[data-panel="diplomacy"]').tap();
 const card=page.locator('#panelBody .card').filter({hasText:'France'}).first();
 await card.getByRole('button',{name:'Offer peace',exact:true}).tap();
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).peaceOffers),[{nation:'england',target:'france'}]);
 await page.reload();await page.locator('[data-panel="diplomacy"]').tap();
 await card.getByRole('button',{name:'Cancel peace offer',exact:true}).tap();
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).peaceOffers),[]);
 await card.getByRole('button',{name:'Offer peace',exact:true}).tap();
 assert.match(await card.innerText(),/evaluated when you end the turn/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'work/rebuild-v2/phone-peace-offer.png'});
 assert.deepEqual(errors,[]);
 console.log('Packaged Android-origin 412x915 touch peace proposal/cancellation and reload persistence passed. Not physical Android.');
}finally{await browser?.close();}
