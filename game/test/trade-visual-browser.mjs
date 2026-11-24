import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
try{
 const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const file=resolve('game',new URL(route.request().url()).pathname.slice(6));try{await route.fulfill({body:await readFile(file),contentType:file.endsWith('.png')?'image/png':/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{await route.fulfill({status:404,body:''});}});
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');
 await page.locator('#startupStatus').waitFor({state:'detached'});
 await page.locator('[data-panel=trade]').tap();
 const fabric=page.locator('.trade-commodity').filter({has:page.getByRole('heading',{name:'Fabric',exact:true})});
 await fabric.getByRole('button',{name:'Bid to buy',exact:true}).tap();
 const orders=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).nations.england.orders.trade);
 assert.ok((await orders()).bids.includes('fabric'));
 await page.reload();await page.locator('[data-panel=trade]').tap();
 await fabric.getByRole('button',{name:'Cancel bid',exact:true}).tap();
 await fabric.getByRole('button',{name:'+',exact:true}).tap();
 assert.equal((await orders()).offers.fabric,1);
 await fabric.getByRole('button',{name:'−',exact:true}).tap();
 assert.equal((await orders()).offers.fabric,0);
 assert.ok(!(await orders()).bids.includes('fabric'));
 // Generate a real minor-country offer through the trade engine.
 await page.evaluate(async()=>{
  const {createGame,saveGame}=await import('./engine.mjs'),{openMarket,setTradeOrder,nextOffer}=await import('./trade.mjs');
  const s=createGame({transportModel:'ports'});for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
  setTradeOrder(s,'england',{good:'timber',bid:true});s.market=openMarket(s);
  const offer=nextOffer(s,s.market);if(!offer||!s.minors[offer.seller])throw Error('Missing minor export');
  window.expectedSeller=s.minors[offer.seller].name;localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();await page.locator('.market-offer').waitFor();
 assert.equal(await page.locator('.offer-heading .commodity-portrait').count(),1);
 await page.locator('#dealQuantity').fill('1');
 await mkdir('work/visual-craft/regression',{recursive:true});await page.screenshot({path:'work/visual-craft/regression/market-offer.png'});
 await page.locator('[data-action=acceptTrade]').tap();
 const s=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 assert.ok((s.market?.deals??s.reports).some(d=>d.buyer==='england'&&s.minors[d.seller]&&d.good==='timber'&&d.quantity===1));
 assert.deepEqual(errors,[]);
 console.log('PASS: illustrated buy/cancel and sell controls, saved bid reload and real minor-country trade acceptance.');
}finally{await browser.close();}
