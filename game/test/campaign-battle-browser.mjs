import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/paddy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=spawn(process.execPath,['game/server.cjs'],{env:{...process.env,IMP_PORT:'18776'},windowsHide:true,stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:412,height:915},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:18776');
 await page.evaluate(async()=>{
  const {createGame,saveGame}=await import('./engine.mjs'),{provinceAdjacency}=await import('./world.mjs'),{stageLandAttacks}=await import('./land-attack.mjs');
  const s=createGame(),adj=provinceAdjacency(s),source=s.provinces.find(p=>p.owner==='england'&&[...adj[p.id]].some(id=>s.provinces.find(q=>q.id===id).owner!=='england'));
  const target=s.provinces.find(p=>p.owner!=='england'&&adj[source.id].has(p.id));target.fort=0;s.wars=[];
  s.armies=[{id:'a',owner:'england',province:source.id,type:'pikeman',hp:100,experience:0,order:null},{id:'d',owner:target.owner,province:target.id,type:'pikeman',hp:100,experience:0,order:null}];
  localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();await page.locator('[data-panel="diplomacy"]').tap();
 const targetOwner=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('imp2-rebuild-v3'));return s.armies.find(u=>u.id==='d').owner;});
 const declaration=page.locator('[data-action="declareWar"]').filter({hasText:'Declare war'});
 for(const b of await declaration.all())if(JSON.parse(await b.getAttribute('data-args')).target===targetOwner){await b.tap();break;}
 let warState=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 assert.equal(warState.declarations[0].target,targetOwner);assert.equal(warState.wars.length,0);
 await page.reload();await page.locator('#endTurn').tap();await page.locator('[data-action="resolve"]').tap();
 warState=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 assert.ok(warState.wars.some(w=>w.includes(targetOwner)&&w.includes('england')));
 await page.locator('#closePanel').tap();await page.locator('[data-panel="army"]').tap();
 await page.locator('[data-action="selectRegiment"]').first().tap();
 await page.locator('[data-action="attackArmy"]').tap();
 const ordered=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 assert.equal(ordered.armies.find(u=>u.id==='a').order.job,'attack');
 assert.notEqual(ordered.provinces.find(p=>p.id===ordered.armies[0].order.province).owner,'england','ordering does not conquer');
 await page.locator('#closePanel').tap();await page.locator('#endTurn').tap();await page.locator('[data-action="resolve"]').tap();
 await page.locator('[data-unit="a"]').tap();await page.locator('.battle-tile.reachable').first().tap();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));assert.ok(saved.activeLandBattle.battle.units.find(u=>u.id==='a').tile!==null);assert.equal(saved.turnPhase,'combat');assert.equal(saved.turn,ordered.turn);
 await page.reload();await page.locator('[data-do="ready"]').tap();await page.locator('[data-do="retreat"]:enabled').waitFor();
 await page.screenshot({path:'work/rebuild-v2/phone-campaign-battle.png'});
 await page.locator('[data-do="retreat"]').tap();await page.locator('#continueCampaign:not([hidden])').waitFor({timeout:30000});
 await page.reload();await page.locator('#continueCampaign').tap();await page.locator('#campaignBattle').waitFor({state:'hidden'});
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 assert.equal(after.turnPhase,undefined);assert.equal(after.turn,ordered.turn+1);assert.equal(after.activeLandBattle,undefined);assert.equal(after.pendingLandAttacks.length,0);assert.ok(after.reports.some(r=>r.kind==='battle'));
 assert.equal(await page.locator('#app').evaluate(el=>el.inert),false);
 await page.reload();assert.equal(await page.locator('#campaignBattle').isVisible(),false);
 await page.evaluate(saved=>{
  saved.player=Object.keys(saved.nations).find(id=>![saved.activeLandBattle.battle.attacker,saved.activeLandBattle.battle.defender].includes(id));
  localStorage.setItem('imp2-rebuild-v3',JSON.stringify(saved));
 },saved);
 await page.reload();await page.locator('#continueCampaign:not([hidden])').waitFor({timeout:45000});
 await page.locator('#continueCampaign').tap();await page.locator('#campaignBattle').waitFor({state:'hidden'});
 await page.evaluate(ordered=>{ordered.armies=ordered.armies.filter(u=>u.id!=='d');localStorage.setItem('imp2-rebuild-v3',JSON.stringify(ordered));},ordered);
 await page.reload();await page.locator('#endTurn').tap();await page.locator('[data-action="resolve"]').tap();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).reports.some(r=>r.occupation));
 assert.equal(await page.locator('#campaignBattle').isVisible(),false);assert.equal(await page.locator('#app').evaluate(el=>el.inert),false);
 const occupied=await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')));
 assert.equal(occupied.armies.find(u=>u.id==='a').experience,0);assert.equal(occupied.pendingLandAttacks.length,0);
 await page.evaluate(async()=>{
  const {createGame,saveGame}=await import('./engine.mjs'),{conquerProvince}=await import('./conquest.mjs');
  const s=createGame(),capital=s.provinces.find(p=>p.town===s.nations.england.capital);
  conquerProvince(s,capital.id,'france');localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();assert.match(await page.locator('#heading').innerText(),/Defeat/);assert.ok(await page.locator('#endTurn').isDisabled());
 await page.locator('[data-panel="reports"]').tap();assert.match(await page.locator('#panelBody').innerText(),/england has been eliminated/);
 await page.evaluate(async()=>{
  const {createGame,saveGame}=await import('./engine.mjs');const s=createGame();
  for(const [i,p] of s.provinces.filter(p=>p.old).entries())p.owner=i<42?'england':'minorFixture';
  for(const t of s.tiles)t.owner=s.provinces.find(p=>p.id===t.province)?.owner??t.owner;
  localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();await page.locator('#endTurn').tap();await page.locator('[data-action="resolve"]').tap();
 assert.match(await page.locator('#heading').innerText(),/Victory/);assert.match(await page.locator('#panelBody').innerText(),/42 of 83/);
 assert.ok(await page.locator('#endTurn').isDisabled());await page.reload();assert.match(await page.locator('#heading').innerText(),/Victory/);
 assert.deepEqual(errors,[]);console.log('Campaign touch battle: deployment save/reload, retreat, result reload and return passed');
}finally{await browser?.close();server.kill();}