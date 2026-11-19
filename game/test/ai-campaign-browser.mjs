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
 await page.evaluate(async()=>{
  const {createGame,command,resolveTurn,saveGame}=await import('./engine.mjs');
  const {provinceAdjacency}=await import('./world.mjs');
  const {startLandBattle,commandLandBattle}=await import('./campaign-battle.mjs');
  const {chooseBattleAction}=await import('./battle-ai.mjs');
  let s=createGame({player:'france',simpleFood:true});const adj=provinceAdjacency(s);
  const source=s.provinces.find(p=>p.owner==='france'&&[...adj[p.id]].some(k=>s.provinces.find(q=>q.id===k)?.owner==='spain'));
  const target=s.provinces.find(p=>p.owner==='spain'&&adj[source.id].has(p.id));target.fort=0;s.wars=[['france','spain']];
  s.armies=[{id:'a',owner:'france',province:source.id,type:'regular',hp:100,experience:0,order:null},{id:'d',owner:'spain',province:target.id,type:'levy',hp:100,experience:0,order:null}];
  s=command(s,'france',{type:'army',units:['a'],job:'attack',province:target.id});s.market={complete:true,deals:[],inTransit:[],diplomacy:[]};s=startLandBattle(resolveTurn(s));
  for(let i=0;i<2000&&s.activeLandBattle.battle.phase!=='finished';i++){
   const b=s.activeLandBattle.battle,side=b.phase==='deployment'?(b.ready[0]?1:0):b.activeSide,nation=side?b.defender:b.attacker;
   s=commandLandBattle(s,nation,chooseBattleAction(b,nation));
  }
  if(s.activeLandBattle.battle.phase!=='finished')throw Error('Battle did not finish');
  localStorage.setItem('imp2-rebuild-v3',saveGame(s));
 });
 await page.reload();await page.locator('#continueCampaign').waitFor({state:'visible'});
 assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('imp2-rebuild-v3')).activeLandBattle),'human result must await acknowledgement');
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('imp2-rebuild-v3'));s.player='england';localStorage.setItem('imp2-rebuild-v3',JSON.stringify(s));});
 await page.reload();await page.waitForFunction(()=>{const s=JSON.parse(localStorage.getItem('imp2-rebuild-v3'));return s.turn===1&&!s.activeLandBattle;});
 assert.equal(await page.locator('#campaignBattle').isVisible(),false);assert.deepEqual(errors,[]);
 console.log('412x915: human battle waits for acknowledgement; completed AI-only battle automatically applies campaign result and economy.');
}finally{await browser?.close();server.kill();}
