import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=spawn(process.execPath,['game/server.cjs'],{env:{...process.env,IMP_PORT:'18780'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:18780');
 const port=await page.evaluate(async()=>{
  const {createGame,saveGame}=await import('./engine.mjs');const {portSeas}=await import('./overseas.mjs');const s=createGame();
  const tile=s.tiles.find(t=>t.owner==='england'&&t.id!==s.nations.england.capital&&portSeas(s,t.id).length);tile.port=true;
  s.ships.find(u=>u.owner==='england').location=portSeas(s,tile.id)[0];localStorage.setItem('imp2-rebuild-v3',saveGame(s));return tile.id;
 });
 await page.reload();await page.locator('[data-panel="navy"]').tap();await page.locator('[data-action="selectShip"]').first().tap();
 await page.locator('#sailDestination').selectOption('port:'+port);await page.locator('[data-action="viewSea"]').tap();
 await page.locator('[data-panel="navy"]').tap();await page.locator('#sailDestination').selectOption('port:'+port);await page.locator('[data-action="sailFleet"]').tap();
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));assert.equal(saved.ships.find(u=>u.owner==='england').order.destination,'port:'+port);
 await page.reload();await page.locator('#endTurn').tap();await page.locator('[data-action="resolve"]').tap();await page.reload();
 saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));assert.equal(saved.turn,1);assert.equal(saved.ships.find(u=>u.owner==='england').location,'port:'+port);
 await page.locator('[data-panel="navy"]').tap();assert.match(await page.locator('#panelBody').innerText(),/Anchored in/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'work/rebuild-v2/phone-port-arrival.png'});assert.deepEqual(errors,[]);console.log('Phone port selection, map focus, sailing, turn and reload passed');
}finally{await browser?.close();server.kill();}
