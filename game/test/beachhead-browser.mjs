import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
let browser;
try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.host!=='appassets.androidplatform.net'||!url.pathname.startsWith('/game/'))return route.abort();
  const relative=decodeURIComponent(url.pathname.slice(6));if(relative.includes('..'))return route.abort();
  try{const body=await readFile(resolve('work/rebuild-android/assets/game',relative));await route.fulfill({body,contentType:relative.endsWith('.mjs')||relative.endsWith('.js')?'text/javascript':relative.endsWith('.css')?'text/css':relative.endsWith('.svg')?'image/svg+xml':'text/html'});}catch{await route.fulfill({status:404,body:''});}
 });
 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');
 const target=await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');const s=createGame({transportModel:'ports'}),ship=s.ships.find(u=>u.owner==='england');const p=s.provinces.find(p=>!p.old&&s.seas.zones.some(z=>z.coast.some(id=>s.tiles.some(t=>t.id===id&&t.province===p.id))));const zone=s.seas.zones.find(z=>z.coast.some(id=>s.tiles.some(t=>t.id===id&&t.province===p.id)));ship.location=zone.id;s.nations.england.revealed.push(...zone.coast);s.armies=[{id:'landing',owner:'england',province:s.tiles.find(t=>t.id===s.nations.england.capital).province,type:'pikeman',hp:100,experience:0,order:null}];localStorage.setItem('imp2-rebuild-v3',saveGame(s));return p.id;});
 await page.reload();await page.locator('[data-panel="navy"]').tap();await page.locator('[data-action="selectShip"]').first().tap();await page.locator('[data-action="beachheadFleet"]').first().tap();assert.match(await page.locator('#panelBody').innerText(),/Beachhead establishing/);
 await page.reload();await page.locator('#endTurn').tap();await page.locator('[data-action="resolve"]').tap();
 await page.reload();await page.locator('[data-panel="army"]').tap();await page.locator('[data-action="selectRegiment"]').tap();await page.locator('#attackDestination').selectOption(target);await page.locator('[data-action="attackArmy"]').tap();
 const s=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));assert.equal(s.transportModel,'ports');assert.equal(s.turn,1);assert.equal(s.armies.find(u=>u.id==='landing').order.province,target);
 await page.screenshot({path:'work/rebuild-v2/phone-invasion-order.png'});assert.deepEqual(errors,[]);console.log('Phone touch beachhead, real preparation turn, landing selection and saved order passed');
}finally{await browser?.close();}
