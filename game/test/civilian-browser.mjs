import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=spawn(process.execPath,['game/server.cjs'],{env:{...process.env,IMP_PORT:'18777'},windowsHide:true,stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:18777');
 await page.evaluate(async()=>{
  const {createGame,saveGame}=await import('./engine.mjs');const s=createGame();
  s.provinces.find(p=>p.town===s.nations.england.capital).fort=0;
  localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();await page.locator('[data-panel="civilians"]').tap();
 await page.locator('.row').filter({hasText:'Engineer'}).locator('[data-action="selectCivilian"]').tap();
 await page.getByRole('button',{name:/Fort level 1/}).tap();
 let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 assert.equal(state.civilians.find(u=>u.owner==='england'&&u.type==='engineer').order.job,'fort');
 await page.reload();
 for(let i=0;i<2;i++){
  await page.locator('#endTurn').tap();await page.locator('[data-action="resolve"]').tap();await page.locator('#closePanel').tap();
 }
 state=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 assert.equal(state.provinces.find(p=>p.town===state.nations.england.capital).fort,1);
 await page.locator('#home').tap();assert.match(await page.locator('#selection').innerText(),/Fort level 1/);
 await page.screenshot({path:'work/rebuild-v2/phone-fort-completed.png'});
 const target=await page.evaluate(async()=>{
  const {createGame,saveGame}=await import('./engine.mjs'),{nearby,worldIndex}=await import('./world.mjs'),{goalPath}=await import('./rules.mjs');
  const s=createGame(),n=s.nations.england,home=s.tiles.find(t=>t.id===n.capital);
  const target=nearby(home,worldIndex(s)).find(t=>t.owner==='england');
  n.known=[...new Set([...goalPath('65'),'65'])];n.stock.steel=12;n.stock.lumber=20;
  home.road=true;home.rail=true;target.road=true;target.terrain=0;target.resource='iron';target.level=4;
  s.civilians.push({id:'rail-test',owner:'england',type:'railBuilder',tile:home.id,order:null});
  localStorage.setItem('imp2-rebuild-v3',saveGame(s));return target.id;
 });
 await page.reload();await page.locator('[data-panel="civilians"]').tap();
 await page.locator('.row').filter({hasText:'Rail Builder'}).locator('[data-action="selectCivilian"]').tap();
 await page.locator('[data-panel="transport"]').tap();await page.getByRole('button',{name:target,exact:true}).first().tap();
 await page.getByRole('button',{name:/Build rail/}).tap();
 state=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 assert.equal(state.civilians.find(u=>u.id==='rail-test').tile,target);assert.equal(state.civilians.find(u=>u.id==='rail-test').order.job,'rail');
 await page.reload();await page.locator('#endTurn').tap();await page.locator('[data-action="resolve"]').tap();await page.locator('#closePanel').tap();
 state=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));assert.equal(state.tiles.find(t=>t.id===target).rail,true);
 assert.deepEqual(errors,[]);console.log('Phone touch fort and rail orders, reload and construction completion passed');
}finally{await browser?.close();server.kill();}
