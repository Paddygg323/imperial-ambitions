import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
 const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.host!=='appassets.androidplatform.net'||!url.pathname.startsWith('/game/'))return route.abort();
  const relative=decodeURIComponent(url.pathname.slice(6));if(relative.includes('..'))return route.abort();
  try{const body=await readFile(resolve('game',relative));await route.fulfill({body,contentType:relative.endsWith('.mjs')||relative.endsWith('.js')?'text/javascript':relative.endsWith('.css')?'text/css':relative.endsWith('.svg')?'image/svg+xml':relative.endsWith('.png')?'image/png':'text/html'});}catch{await route.fulfill({status:404,body:''});}
 });
 await page.addInitScript(()=>{window.AndroidGame={exportSave:(json,name)=>{window.savedExport={json,name};}};});

 await page.goto('https://appassets.androidplatform.net/game/index.html?native=1');
 await page.evaluate(async()=>{
  const {createGame,saveGame}=await import('./engine.mjs');const s=createGame(),ship=s.ships.find(u=>u.owner===s.player);
  ship.aggression=0;ship.experience=42;s.ships.push({...ship,id:'second',aggression:2});localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();await page.locator('[data-panel="navy"]').tap();
 await page.locator('[data-action="selectShip"]').first().tap();
 assert.equal(await page.locator('#fleetAggression').inputValue(),'0');
 assert.match(await page.locator('#panelBody').innerText(),/Firepower 2.*Range 4.*Armour 95.*Experience 42/);
 await page.locator('#shipName').fill('HMS <Resolute>');await page.getByRole('button',{name:'Rename ship',exact:true}).tap();
 assert.ok(await page.getByRole('button',{name:/HMS <Resolute>/}).count());
 await page.reload();await page.locator('[data-panel="navy"]').tap();
 await page.getByRole('button',{name:/HMS <Resolute>/}).tap();
 assert.equal(await page.locator('#shipName').inputValue(),'HMS <Resolute>');
 await page.locator('[data-action="selectShip"][data-args*="second"]').tap();
 assert.equal(await page.locator('#fleetAggression').inputValue(),'');
 await page.locator('#fleetAggression').selectOption('2');await page.getByRole('button',{name:/Set selected ships/}).tap();
 assert.equal(await page.locator('#fleetAggression').inputValue(),'2');
 const ships=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).ships.filter(u=>u.owner==='england'));
 assert.ok(ships.filter(u=>u.name==='HMS <Resolute>'||u.id==='second').every(u=>u.aggression===2));
 assert.ok(ships.filter(u=>u.name!=='HMS <Resolute>'&&u.id!=='second').every(u=>(u.aggression??1)===1),'Unselected ships keep their aggression');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await mkdir('work/visual-craft/regression',{recursive:true});await page.screenshot({path:'work/visual-craft/regression/phone-fleet-details.png'});
 assert.deepEqual(errors,[]);console.log('Fleet naming/reload, combat details, selected-only mixed aggression and phone layout pass; Chromium, not Pixel.');
}finally{await browser?.close();}

