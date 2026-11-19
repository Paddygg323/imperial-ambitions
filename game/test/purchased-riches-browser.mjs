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
 await page.evaluate(async()=>{
  const {createGame,saveGame,transport}=await import('./engine.mjs'),{openMarket}=await import('./trade.mjs');
  const s=createGame();for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
  const row=transport(s,'scotland').rows.find(r=>r.good==='timber'&&r.delivered>0),t=s.tiles.find(t=>t.id===row.tile);
  t.resource='gold';t.level=2;t.prospected=true;t.purchasedBy='england';s.nations.england.cash=20000;s.relations.england.scotland=127;
  s.market=openMarket(s);localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();
 assert.match(await page.locator('#panelBody').innerText(),/From your purchased land/);
 await page.locator('#dealQuantity').fill('1');
 await page.getByRole('button',{name:'Accept',exact:true}).tap();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 assert.equal(saved.nations.england.cash,19899);assert.equal(saved.market.inTransit[0].good,'gold');assert.equal(saved.market.inTransit[0].quantity,1);
 await page.reload();const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));assert.equal(restored.nations.england.cash,19899);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('Packaged riches offer and paid touch acceptance persist after reload at412x915. Chromium, not Pixel/WebView.');
}finally{await browser.close();}


