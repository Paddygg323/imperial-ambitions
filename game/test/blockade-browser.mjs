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
 await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');const {portSeas}=await import('./overseas.mjs');const s=createGame();s.wars=[['england','portugal']];s.ships.find(u=>u.owner==='england').location=portSeas(s,s.nations.portugal.capital)[0];localStorage.setItem('imp2-rebuild-v3',saveGame(s));});
 await page.reload();await page.locator('[data-panel="navy"]').tap();await page.locator('[data-action="selectShip"]').first().tap();await page.locator('[data-action="blockadeFleet"]').first().tap();
 assert.match(await page.locator('#panelBody').innerText(),/Blockading/);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));assert.equal(saved.ships.find(u=>u.owner==='england').order.job,'blockade');
 await page.reload();await page.locator('[data-panel="navy"]').tap();assert.match(await page.locator('#panelBody').innerText(),/Blockading/);
 await page.screenshot({path:'work/rebuild-v2/phone-blockade-order.png'});assert.deepEqual(errors,[]);console.log('Phone touch blockade selection and persistence passed');
}finally{await browser?.close();server.kill();}
