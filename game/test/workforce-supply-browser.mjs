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
  const {createGame,saveGame}=await import('./engine.mjs');const s=createGame(),n=s.nations.england;
  n.simpleFood=false;n.simpleLuxuries=false;n.workers=Array.from({length:20},(_,i)=>({id:'food-ui-'+i,type:i<10?'peasant':'apprentice',diet:i<10?'grain':'meat',fit:i<10}));
  n.stock.sugar=0;n.stock.meat=0;n.stock.fish=0;n.stock.grain=30;
  s.ships=s.ships.filter(u=>u.owner!=='england');s.armies=s.armies.filter(u=>u.owner!=='england');
  for(const t of s.tiles.filter(t=>t.owner==='england')){t.resource='grain';t.level=4;}
  localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();
 assert.match(await page.locator('#summary .bad').innerText(),/supply shortfall/);
 await page.locator('[data-panel="industry"]').tap();await page.getByRole('button',{name:'Labour',exact:true}).tap();
 const panel=page.locator('.workforce-supply');assert.match(await panel.innerText(),/Meat \+ fish/);
 assert.match(await panel.locator('tr').filter({hasText:'Meat + fish'}).innerText(),/[0-9]+ \/ 10/);
 assert.match(await panel.locator('tr').filter({hasText:'Sugar'}).innerText(),/Sugar\s+10\s+0\s+0/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'work/rebuild-v2/phone-workforce-supply.png'});
 await page.locator('#closePanel').tap();await page.locator('#endTurn').tap();
 assert.equal(await page.locator('.workforce-supply').count(),1);assert.match(await page.locator('#panelBody').innerText(),/Food and workforce supply/);
 await page.locator('#closePanel').tap();
 await page.evaluate(()=>{const key='imp2-rebuild-v3',s=JSON.parse(localStorage.getItem(key));s.nations.england.simpleFood=true;localStorage.setItem(key,JSON.stringify(s));});
 await page.reload();assert.equal(await page.locator('#summary .bad').count(),0);
 await page.locator('[data-panel="industry"]').tap();await page.getByRole('button',{name:'Labour',exact:true}).tap();
 assert.match(await page.locator('.workforce-supply').innerText(),/Any food/);
 assert.deepEqual(errors,[]);console.log('Phone workforce supply distinguishes wrong-diet surplus from sustainable food, displays real luxury demand, and respects simple-food settings at 412x915. Chromium only.');
}finally{await browser?.close();}
