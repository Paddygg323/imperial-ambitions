import {createRequire} from 'node:module';import {readFile} from 'node:fs/promises';import {resolve} from 'node:path';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url()),relative=decodeURIComponent(url.pathname.slice(6));
  if(url.host!=='appassets.androidplatform.net'||!url.pathname.startsWith('/game/')||relative.includes('..'))return route.abort();
  try{const body=await readFile(resolve('work/rebuild-android/assets/game',relative));await route.fulfill({body,contentType:/\.m?js$/.test(relative)?'text/javascript':relative.endsWith('.css')?'text/css':relative.endsWith('.svg')?'image/svg+xml':'text/html'});}catch{await route.fulfill({status:404,body:''});}
 });
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');
 const quote=await page.evaluate(async()=>{
  const {createGame,saveGame,transport}=await import('./engine.mjs'),{landPurchaseQuote}=await import('./land-purchase.mjs');
  const s=createGame(),n=s.nations.england;n.known.push('22');n.cash=20000;n.embassies=['scotland'];
  const row=transport(s,'scotland').rows.find(r=>r.good!=='fish'&&r.capacity>0),t=s.tiles.find(t=>t.id===row.tile);t.resource='iron';t.terrain=8;t.level=0;t.prospected=true;
  s.civilians.push({id:'touch-merchant',type:'merchant',owner:'england',tile:t.id,order:null});
  s.civilians.find(c=>c.owner==='england'&&c.type==='builder').tile=t.id;
  localStorage.setItem('imp2-rebuild-v3',saveGame(s));return landPurchaseQuote(s,'england',t);
 });
 await page.reload();await page.locator('[data-panel="civilians"]').tap();
 await page.locator('#panelBody .row').filter({hasText:'Merchant'}).getByRole('button',{name:'Select',exact:true}).tap();
 const buy=page.getByRole('button',{name:'Buy land for $'+quote.toLocaleString(),exact:true});assert.match(await buy.innerText(),new RegExp(String(quote.toLocaleString())));
 assert.match(await page.locator('#selection').innerText(),/1 turn.*tile stays part of Scotland/);
 await buy.scrollIntoViewIfNeeded();await page.screenshot({path:'work/rebuild-v2/phone-land-purchase.png'});await buy.tap();
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));assert.equal(saved.nations.england.cash,20000-quote);assert.equal(saved.civilians.find(c=>c.id==='touch-merchant').order.job,'purchase');
 await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).civilians.find(c=>c.id==='touch-merchant').order.remaining),1);
 await page.evaluate(async()=>{const {loadGame,saveGame,finishTurnEconomy}=await import('./engine.mjs');const s=loadGame(localStorage.getItem('imp2-rebuild-v3'));s.turnPhase='combat';localStorage.setItem('imp2-rebuild-v3',saveGame(finishTurnEconomy(s)));});
 await page.reload();await page.locator('[data-panel="civilians"]').tap();await page.locator('#panelBody .row').filter({hasText:'Builder'}).getByRole('button',{name:'Select',exact:true}).tap();
 assert.match(await page.locator('#selection').innerText(),/Land purchased by England/);assert.match(await page.locator('#selection').innerText(),/Buy these resources through trade/);
 await page.screenshot({path:'work/rebuild-v2/phone-purchased-land.png'});
 await page.getByRole('button',{name:'Develop → 1',exact:true}).tap();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));assert.equal(saved.civilians.find(c=>c.owner==='england'&&c.type==='builder').order.job,'develop');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('Packaged412x915 touch quote, paid purchase, reload, completion and foreign builder order pass. Chromium, not physical Pixel/WebView.');
}finally{await browser.close();}
