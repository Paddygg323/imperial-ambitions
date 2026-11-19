import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=spawn(process.execPath,['game/server.cjs'],{env:{...process.env,IMP_PORT:'18779'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:18779');
 await page.evaluate(async()=>{const {createGame,saveGame}=await import('./engine.mjs');const s=createGame();s.nations.england.cash=-100;localStorage.setItem('imp2-rebuild-v3',saveGame(s));});
 await page.reload();await page.locator('#endTurn').tap();
 const text=await page.locator('#panelBody').innerText();assert.match(text,/Treasury \$-100/);assert.match(text,/Available including credit \$100/);assert.match(text,/Credit limit \$200/);assert.match(text,/Interest rate 12%/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'work/rebuild-v2/phone-finance.png'});
 await page.locator('[data-action="resolve"]').tap();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));assert.equal(state.nations.england.cash,-112);assert.equal(state.nations.england.finance.interest,12);assert.equal(state.turn,1);
 await page.reload();assert.match(await page.locator('#summary').innerText(),/\$-112/);assert.deepEqual(errors,[]);
 console.log('Phone touch review, debt interest, persisted turn and reload passed');
}finally{await browser?.close();server.kill();}
