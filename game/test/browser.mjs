import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['game/server.cjs'],{env:{...process.env,IMP_PORT:'18774'},windowsHide:true,stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Server stopped '+code)));});
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
fs.mkdirSync('work/rebuild-v2',{recursive:true});
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:18774');await page.locator('#heading').waitFor();
 await page.screenshot({path:'work/rebuild-v2/phone-map.png'});
 for(const width of [320,375,412,540]){
  await page.setViewportSize({width,height:915});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'page overflow');
  for(const name of ['industry','transport','research','civilians','reports','trade','navy','army']){
   await page.locator(`[data-panel="${name}"]`).click();assert.equal(await page.locator('#panel').isVisible(),true);
   assert.equal(await page.locator('#panel').evaluate(e=>e.scrollWidth>e.clientWidth),false,name+' dialog overflow');await page.locator('#closePanel').click();
  }
 }
 await page.setViewportSize({width:412,height:915});
 await page.locator('[data-panel="research"]').click();
 await page.locator('[data-action="startResearch"][data-args*="8"]').first().click();
 await page.locator('[data-action="fund"]').last().click();
 assert.match(await page.locator('#panelBody').innerText(),/\$100/);
 await page.screenshot({path:'work/rebuild-v2/phone-research.png'});
 await page.locator('#closePanel').click();
 await page.locator('[data-panel="industry"]').click();
 await page.locator('[data-action="produce"][data-args*="woolFabric"]').last().click();
 await page.locator('[data-action="industryTab"][data-args*="labour"]').click();
 await page.locator('[data-action="recruitWorker"]').click();
 await page.locator('#closePanel').click();
 await page.locator('#endTurn').click();await page.locator('[data-action="resolve"]').click();
 assert.match(await page.locator('#heading').innerText(),/1502/);assert.match(await page.locator('#panelBody').innerText(),/peasant recruited/i);
 await page.reload();assert.match(await page.locator('#heading').innerText(),/1502/);
 await page.locator('[data-panel="industry"]').click();await page.locator('[data-action="industryTab"][data-args*="construction"]').click();
 await page.screenshot({path:'work/rebuild-v2/phone-construction.png'});
 await page.evaluate(async()=>{
  const {createGame,command,saveGame}=await import('./engine.mjs');let s=createGame();s.nations.france.stock.fabric=30;
  s=command(s,'england',{type:'tradeOrder',good:'fabric',bid:true});localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();await page.locator('#endTurn').click();await page.locator('[data-action="resolve"]').click();
 await page.locator('#dealQuantity').waitFor();assert.match(await page.locator('#heading').innerText(),/1500/);
 await page.reload();await page.locator('#dealQuantity').waitFor();await page.locator('#dealQuantity').fill('1');
 await page.screenshot({path:'work/rebuild-v2/phone-trade.png'});await page.locator('[data-action="acceptTrade"]').click();
 while(await page.locator('[data-action="rejectTrade"]').count())await page.locator('[data-action="rejectTrade"]').first().click();
 await page.locator('[data-action="finishTurn"]').click();assert.match(await page.locator('#heading').innerText(),/1502/);
 await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');localStorage.setItem('imp2-rebuild-v3',saveGame(createGame()));});
 await page.reload();await page.locator('[data-panel="navy"]').click();await page.locator('[data-action="selectShip"]').first().click();
 await page.locator('[data-action="sailFleet"]').click();assert.match(await page.locator('#panelBody').innerText(),/Sailing to/);
 await page.screenshot({path:'work/rebuild-v2/phone-navy.png'});await page.locator('#closePanel').click();
 await page.locator('#endTurn').click();await page.locator('[data-action="resolve"]').click();assert.match(await page.locator('#heading').innerText(),/1502/);
 await page.locator('#closePanel').click();await page.locator('#strategic').click();await page.screenshot({path:'work/rebuild-v2/phone-world.png'});
 const destination=await page.evaluate(async()=>{
  const {createGame,command,resolveTurn,saveGame}=await import('./engine.mjs');let s=createGame();s.nations={england:s.nations.england};s.civilians=s.civilians.filter(c=>c.owner==='england');s.ships=s.ships.filter(c=>c.owner==='england');
  s=resolveTurn(command(s,'england',{type:'recruitUnit',kind:'army',unit:'pikeman'}));localStorage.setItem('imp2-rebuild-v3',saveGame(s));return s.provinces.find(p=>p.owner==='england'&&p.id!==s.armies[0].province).id;
 });
 await page.reload();await page.locator('[data-panel="army"]').click();await page.locator('[data-action="selectRegiment"]').click();
 await page.locator('#armyDestination').selectOption(destination);await page.locator('[data-action="deployArmy"]').click();assert.match(await page.locator('#panelBody').innerText(),/deploy →/);
 await page.screenshot({path:'work/rebuild-v2/phone-army.png'});await page.locator('#closePanel').click();
 await page.locator('#endTurn').click();await page.locator('[data-action="resolve"]').click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).armies[0].province),destination);
 assert.deepEqual(errors,[]);console.log('PASS: phone widths, 8 panels, economy/research, trade acceptance/reload, sailing and regiment redeployment');
}finally{await browser.close();server.kill();}

