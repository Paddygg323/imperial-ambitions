import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {planMilitary,garrisonReserve} from '../ai-military.mjs';
import {ARMY} from '../rules.mjs';
function fixture(){
 const s=createGame({simpleFood:true}),n=s.nations.france;
 s.armies=s.armies.filter(u=>u.owner!=='france');s.construction=[];
 n.workers=Array.from({length:10},(_,i)=>({id:'fw'+i,type:'peasant',fit:true,diet:i%2?'meat':'grain'}));
 for(const good of Object.keys(n.stock))n.stock[good]=100;
 for(const [i,t] of s.tiles.filter(t=>t.owner==='france').entries())Object.assign(t,{resource:i%2?'grain':'meat',level:4,rail:true,prospected:true});
 return s;
}

test('zero-cash nation can recruit material-funded infantry and protects missing garrison supplies',()=>{
 const s=fixture();s.nations.france.cash=0;s.nations.france.finance.credit=0;
 assert.deepEqual(garrisonReserve(s,'france'),{fabric:6,castIron:6,lumber:6});
 const next=planMilitary(s,'france',command);
 assert.equal(next.construction.filter(c=>c.kind==='army').length,2);
 assert.equal(next.nations.france.cash,0);assert.equal(next.nations.france.workers.length,8);
 assert.deepEqual(garrisonReserve(next,'france'),{});
 assert.deepEqual(garrisonReserve(s,s.player),{});
});
test('military AI recruits through real costs and workers, then construction creates the garrison',()=>{
 const start=fixture(),s=planMilitary(start,'france',command),orders=s.construction.filter(c=>c.owner==='france'&&c.kind==='army');
 assert.equal(orders.length,2);assert.equal(s.nations.france.workers.length,8);assert.equal(s.armies.filter(u=>u.owner==='france').length,0);
 for(const good of Object.keys(start.nations.france.stock)){
  const spent=orders.reduce((sum,c)=>sum+(ARMY[c.type].cost.goods[good]??0),0);
  assert.equal(s.nations.france.stock[good],start.nations.france.stock[good]-spent);
 }
 assert.equal(start.nations.france.workers.length,10);
 s.market={complete:true,deals:[],inTransit:[],diplomacy:[]};
 const end=resolveTurn(loadGame(saveGame(s)));
 assert.equal(end.armies.filter(u=>u.owner==='france').length,2);
 assert.equal(end.construction.length,0);
});
test('AI redeploys surplus to its capital and respects existing orders without teleportation',()=>{
 const s=fixture(),capital=s.tiles.find(t=>t.id===s.nations.france.capital).province;
 const source=s.provinces.find(p=>p.owner==='france'&&p.id!==capital).id;
 s.armies.push(...[0,1,2].map(i=>({id:'g'+i,owner:'france',province:source,type:'pikeman',hp:100,experience:0,order:i===2?{job:'done'}:null})));
 const next=planMilitary(s,'france',command);
 for(const id of ['g0','g1']){const u=next.armies.find(u=>u.id===id);assert.equal(u.province,source);assert.deepEqual(u.order,{job:'deploy',province:capital});}
 assert.deepEqual(next.armies.find(u=>u.id==='g2').order,{job:'done'});
 assert.equal(next.construction.length,0);
});
test('AI does not recruit through labour, food or construction shortages, or control the human nation',()=>{
 for(const constraint of ['workers','food','supplies']){
  const s=fixture(),n=s.nations.france;
  if(constraint==='workers')n.workers=n.workers.slice(0,6);
  if(constraint==='food')for(const t of s.tiles)if(t.owner==='france')t.level=0;
  if(constraint==='supplies')for(const good of ['fabric','castIron','lumber','bronze'])n.stock[good]=0;
  const end=planMilitary(s,'france',command);assert.equal(end.construction.length,0,constraint);
 }
 const s=fixture();assert.equal(planMilitary(s,s.player,command),s);
});
test('war-front reinforcement keeps two regiments defending the capital',async()=>{
 const {provinceAdjacency}=await import('../world.mjs');
 const s=fixture(),capital=s.tiles.find(t=>t.id===s.nations.france.capital).province,adj=provinceAdjacency(s);
 const front=s.provinces.find(p=>p.owner==='france'&&p.id!==capital&&[...adj[p.id]??[]].some(k=>s.provinces.find(q=>q.id===k)?.owner!=='france'));
 assert.ok(front);
 const enemy=s.provinces.find(p=>adj[front.id].has(p.id)&&p.owner!=='france').owner;
 s.wars=[['france',enemy]];
 s.armies.push(...[0,1,2,3].map(i=>({id:'capital'+i,owner:'france',province:capital,type:'pikeman',hp:100,experience:0,order:null})));
 const end=planMilitary(s,'france',command),guards=end.armies.filter(u=>u.owner==='france'&&!u.order);
 assert.equal(guards.length,2);assert.ok(guards.every(u=>u.province===capital));
 const moved=end.armies.filter(u=>u.owner==='france'&&u.order?.job==='deploy');assert.equal(moved.length,2);
 assert.ok(moved.every(u=>[...adj[u.order.province]??[]].some(k=>s.provinces.find(q=>q.id===k)?.owner===enemy)));
});
test('AI attacks one adjacent enemy with a concentrated force while retaining source garrisons',async()=>{
 const {startLandBattle}=await import('../campaign-battle.mjs');
 const s=fixture();s.wars=[['france','spain']];s.armies=[];
 for(const p of s.provinces){p.fort=0;if(p.owner==='france')for(let i=0;i<6;i++)s.armies.push({id:`f-${p.id}-${i}`,owner:'france',province:p.id,type:'pikeman',hp:100,experience:0,order:null});}
 const next=planMilitary(s,'france',command),attackers=next.armies.filter(u=>u.order?.job==='attack');
 assert.ok(attackers.length>=4);assert.equal(new Set(attackers.map(u=>u.order.province)).size,1);
 assert.equal(next.construction.length,0,'outgoing troops are not losses requiring replacements');assert.equal(next.nations.france.workers.length,s.nations.france.workers.length);
 const target=attackers[0].order.province;assert.equal(next.provinces.find(p=>p.id===target).owner,'spain');
 for(const source of new Set(attackers.map(u=>u.province)))assert.ok(next.armies.filter(u=>u.owner==='france'&&u.province===source&&!u.order).length>=2);
 next.market={complete:true,deals:[],inTransit:[],diplomacy:[]};const pending=resolveTurn(loadGame(saveGame(next)));
 assert.ok(pending.pendingLandAttacks.length);const end=startLandBattle(pending);
 assert.equal(end.provinces.find(p=>p.id===target).owner,'france');assert.equal(end.turn,1);
});
test('AI cannot attack nations at peace or initiate an unsupported siege',()=>{
 for(const war of [false,true]){
  const s=fixture();s.wars=war?[['france','spain']]:[];s.armies=[];
  for(const p of s.provinces){p.fort=1;if(p.owner==='france')for(let i=0;i<6;i++)s.armies.push({id:`f-${p.id}-${i}`,owner:'france',province:p.id,type:'pikeman',hp:100,experience:0,order:null});}
  assert.ok(!planMilitary(s,'france',command).armies.some(u=>u.order?.job==='attack'));
 }
});
test('fortified frontier triggers paid artillery recruitment and reserves its materials',()=>{
 const s=fixture();s.wars=[['france','spain']];
 assert.ok(garrisonReserve(s,'france').bronze>=ARMY.culverin.cost.goods.bronze);
 const end=planMilitary(s,'france',command),orders=end.construction.filter(c=>c.owner==='france'&&c.kind==='army');
 assert.equal(orders.length,2);assert.ok(orders.every(c=>ARMY[c.type].category>=8));
 assert.equal(end.nations.france.workers.length,8);
 assert.equal(end.nations.france.stock.bronze,s.nations.france.stock.bronze-orders.reduce((q,c)=>q+(ARMY[c.type].cost.goods.bronze??0),0));
});
test('AI stages guns even behind an infantry-filled frontier and retains home defenders',async()=>{
 const {provinceAdjacency}=await import('../world.mjs');const s=fixture(),adj=provinceAdjacency(s);s.wars=[['france','spain']];
 const owned=s.provinces.filter(p=>p.owner==='france');const target=s.provinces.filter(p=>p.owner==='spain'&&owned.some(q=>adj[q.id].has(p.id))).sort((a,b)=>Number(b.capital)-Number(a.capital)||a.id.localeCompare(b.id))[0];
 const staging=owned.filter(p=>adj[p.id].has(target.id)).sort((a,b)=>a.id.localeCompare(b.id))[0].id;
 const capital=s.tiles.find(t=>t.id===s.nations.france.capital).province;assert.notEqual(capital,staging);
 for(const p of owned)for(let i=0;i<(p.id===staging?8:2);i++)s.armies.push({id:p.id+'-'+i,owner:'france',province:p.id,type:'pikeman',hp:100,experience:0,order:null});
 for(let i=0;i<2;i++)s.armies.push({id:'gun'+i,owner:'france',province:capital,type:'culverin',hp:100,experience:0,order:null});
 const end=planMilitary(s,'france',command);
 for(const u of end.armies.filter(u=>u.id.startsWith('gun')))assert.deepEqual(u.order,{job:'deploy',province:staging});
 assert.equal(end.armies.filter(u=>u.province===capital&&!u.order).length,2);
 assert.ok(!end.armies.some(u=>u.order?.job==='attack'),'cannot attack with guns still in transit');
});
test('prepared AI siege resolves through tactical actions rather than immediate ownership change',async(t)=>{
 const {startLandBattle,commandLandBattle,finishLandBattle}=await import('../campaign-battle.mjs');const {chooseBattleAction}=await import('../battle-ai.mjs');
 let s=fixture();s.wars=[['france','spain']];s.armies=[];
 for(const p of s.provinces.filter(p=>p.owner==='france'))for(let i=0;i<8;i++)s.armies.push({id:p.id+'-'+i,owner:'france',province:p.id,type:i<6?'musketeer':'royalArtillery',hp:100,experience:0,order:null});
 s=planMilitary(s,'france',command);const attackers=s.armies.filter(u=>u.order?.job==='attack');assert.ok(attackers.length>=6);const target=attackers[0].order.province;
 assert.equal(s.provinces.find(p=>p.id===target).owner,'spain');assert.ok(attackers.filter(u=>ARMY[u.type].category>=8).length>=2);
 s.market={complete:true,deals:[],inTransit:[],diplomacy:[]};s=startLandBattle(resolveTurn(loadGame(saveGame(s))));assert.ok(s.activeLandBattle);
 const attack=s.activeLandBattle.attack;for(const nation of [attack.attacker,attack.defender])while(!s.activeLandBattle.battle.ready[nation===attack.attacker?0:1])s=commandLandBattle(s,nation,chooseBattleAction(s.activeLandBattle.battle,nation));
 let steps=0;const trace=[];while(s.activeLandBattle.battle.phase!=='finished'&&steps++<1500){const b=s.activeLandBattle.battle,nation=b.activeSide===0?attack.attacker:attack.defender;const action=chooseBattleAction(b,nation);trace.push({nation,...action});s=commandLandBattle(s,nation,action);}
 const fs=await import('node:fs');fs.mkdirSync('work/rebuild-v2',{recursive:true});fs.writeFileSync('work/rebuild-v2/siege-trace.json',JSON.stringify({trace,battle:s.activeLandBattle.battle},null,2));
 assert.equal(s.activeLandBattle.battle.phase,'finished');const winner=s.activeLandBattle.battle.winner;assert.equal(winner,'france','prepared force must breach and defeat the level1 fort');
 s=finishLandBattle(loadGame(saveGame(s)));assert.ok(s.reports.some(r=>r.kind==='battle'));assert.equal(s.provinces.find(p=>p.id===target).owner,winner);
 t.diagnostic(JSON.stringify({target,winner,steps,attackers:attackers.length,fortAfter:s.provinces.find(p=>p.id===target).fort}));
});
test('siege readiness rejects short-range guns and an artillery-only assault',()=>{
 for(const kind of ['shortRange','noInfantry']){
  const s=fixture();s.wars=[['france','spain']];s.armies=[];
  for(const p of s.provinces.filter(p=>p.owner==='france'))for(let i=0;i<8;i++)s.armies.push({id:p.id+'-'+i,owner:'france',province:p.id,type:kind==='noInfantry'?'royalArtillery':i<6?'pikeman':'culverin',hp:100,experience:0,order:null});
  assert.ok(!planMilitary(s,'france',command).armies.some(u=>u.order?.job==='attack'),kind);
 }
});

test('recruitment waits for actual casualties rather than replacing committed attackers',()=>{
 const s=fixture();s.wars=[['france','spain']];s.armies=[];
 for(const p of s.provinces){p.fort=0;if(p.owner==='france')for(let i=0;i<6;i++)s.armies.push({id:`r-${p.id}-${i}`,owner:'france',province:p.id,type:'pikeman',hp:100,experience:0,order:null});}
 const ordered=planMilitary(s,'france',command);assert.equal(ordered.construction.length,0);
 const casualties=new Set(ordered.armies.filter(u=>u.order?.job==='attack').map(u=>u.id));assert.ok(casualties.size);
 const survivors=loadGame(saveGame(ordered));survivors.armies=survivors.armies.filter(u=>!casualties.has(u.id));
 const reassigned=planMilitary(survivors,'france',command);assert.equal(reassigned.construction.length,0,'use existing reserves first');assert.ok(reassigned.armies.some(u=>u.order?.job==='deploy'));
 const depleted=loadGame(saveGame(survivors));depleted.armies=[];
 const replacement=planMilitary(depleted,'france',command);assert.ok(replacement.construction.some(c=>c.kind==='army'));
 assert.ok(replacement.nations.france.workers.length<depleted.nations.france.workers.length);
});


test('wooden fort preparation recruits three mobile guns with real horses and retains infantry',async()=>{
 const {goalPath}=await import('../rules.mjs');const {siegePlan,siegeReady}=await import('../ai-siege.mjs');
 const s=fixture(),n=s.nations.france;s.wars=[['france','spain']];
 n.known=[...new Set([...n.known,...goalPath('59'),...goalPath('48')])];
 for(const p of s.provinces)p.fort=1;
 assert.equal(siegePlan(s,'france',{fort:1}).count,3);
 assert.equal(garrisonReserve(s,'france').horses,3);
 const next=planMilitary(s,'france',command);
 assert.deepEqual(next.construction.map(c=>c.type),['horseArtillery','horseArtillery']);
 assert.equal(next.nations.france.stock.horses,n.stock.horses-6);
 assert.equal(next.nations.france.workers.length,n.workers.length-2);
 const force=[...Array(4).fill({type:'musketeer'}),...Array(3).fill({type:'horseArtillery'})];
 assert.ok(siegeReady(force,1));assert.ok(!siegeReady(force,2));assert.ok(!siegeReady(force.slice(1,-1),1));
 assert.ok(!siegeReady(force.map(u=>u.type==='musketeer'?{type:'pikeman'}:u),1));
 s.armies=[];
 for(const p of s.provinces.filter(p=>p.owner==='france'))for(let i=0;i<9;i++)s.armies.push({id:p.id+'-light-'+i,owner:'france',province:p.id,type:i<6?'musketeer':'horseArtillery',hp:100,experience:0,order:null});
 const ordered=planMilitary(loadGame(saveGame(s)),'france',command),attackers=ordered.armies.filter(u=>u.order?.job==='attack');
 assert.ok(attackers.length>=7);assert.ok(siegeReady(attackers,1));
 for(const source of new Set(attackers.map(u=>u.province)))assert.ok(ordered.armies.filter(u=>u.owner==='france'&&u.province===source&&!u.order).length>=2);
});


test('siege garrison relief arrives before a held gun moves and does not recruit a duplicate army',async()=>{
 const {provinceAdjacency}=await import('../world.mjs');const {campaignObjective}=await import('../ai-campaign.mjs');const {resolveArmies}=await import('../army.mjs');
 let s=fixture();s.wars=[['france','spain']];s.armies=[];
 const adj=provinceAdjacency(s),objective=campaignObjective(s,'france'),capital=s.tiles.find(t=>t.id===s.nations.france.capital).province;
 const owned=s.provinces.filter(p=>p.owner==='france'),staging=owned.filter(p=>adj[p.id].has(objective.id)).sort((a,b)=>Number(b.id===capital)-Number(a.id===capital)||a.id.localeCompare(b.id))[0].id;
 const held=owned.find(p=>p.id!==staging).id;
 for(const p of owned)for(let i=0;i<(p.id===staging?8:2);i++)s.armies.push({id:`relief-${p.id}-${i}`,owner:'france',province:p.id,type:(p.id===staging&&i===7||p.id===held&&i===1)?'royalArtillery':'musketeer',hp:100,experience:0,order:null});
 for(const u of s.armies)if(u.province!==staging&&u.province!==held)u.order={job:'done'};
 const gunId=s.armies.find(u=>u.province===held&&u.type==='royalArtillery').id;
 s=planMilitary(s,'france',command);
 const guard=s.armies.find(u=>u.order?.job==='deploy'&&u.order.province===held);assert.ok(guard);assert.equal(guard.province,staging);
 assert.equal(s.armies.find(u=>u.id===gunId).order,null,'gun waits for physical relief');assert.equal(s.construction.length,0);
 const repeated=planMilitary(loadGame(saveGame(s)),'france',command);assert.equal(repeated.armies.find(u=>u.id===gunId).order,null,'incoming guard is not yet a present defender');
 s=loadGame(saveGame(s));resolveArmies(s);assert.equal(s.armies.filter(u=>u.province===held).length,3);
 s=planMilitary(s,'france',command);assert.deepEqual(s.armies.find(u=>u.id===gunId).order,{job:'deploy',province:staging});
 assert.equal(s.armies.filter(u=>u.province===held&&!u.order).length,2);assert.equal(s.construction.length,0);
 s=loadGame(saveGame(s));resolveArmies(s);s=planMilitary(s,'france',command);
 assert.ok(s.armies.some(u=>u.id===gunId&&u.order?.job==='attack'));
 assert.equal(s.armies.filter(u=>u.province===held&&!u.order).length,2);
});
