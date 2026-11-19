import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {planMilitary} from '../ai-military.mjs';import {planInvasionFleets,invasionObjective} from '../ai-invasion.mjs';
import {invasionCapacity} from '../beachhead.mjs';import {TECHS,SHIPS} from '../rules.mjs';
import {startLandBattle,commandLandBattle,finishLandBattle} from '../campaign-battle.mjs';import {chooseBattleAction} from '../battle-ai.mjs';
function fixture(){const s=createGame(),n=s.nations.france;s.wars=[['france','england']];s.nations={england:s.nations.england,france:n};s.civilians=[];s.construction=[];
 s.provinces.find(p=>p.id===s.tiles.find(t=>t.id===s.nations.england.capital).province).fort=2;
 n.known=Object.keys(TECHS);n.cash=20000;n.seenSea=s.seas.zones.map(z=>z.id);n.revealed=s.tiles.filter(t=>s.provinces.find(p=>p.id===t.province)?.old).map(t=>t.id);for(const g of Object.keys(n.stock))n.stock[g]=100;
 const source=s.tiles.find(t=>t.id===n.capital).province;s.armies=Array.from({length:8},(_,i)=>({id:'a'+i,owner:'france',province:source,type:i<6?'musketeer':'royalArtillery',hp:100,experience:0,order:null}));
 s.ships=Array.from({length:3},(_,i)=>({id:'transport'+i,owner:'france',type:'galleon',cargo:SHIPS.galleon.cargo,hp:SHIPS.galleon.hull,location:'home',order:null}));return s;}
test('AI sails from home, establishes a beachhead, waits, and conquers through actual battle and saved turns',()=>{
 let s=fixture();const p=invasionObjective(s,'france');assert.ok(p);const owner=p.owner;let waited=false,sailed=false;
 for(let turn=0;turn<10&&!s.pendingLandAttacks?.length;turn++){
  s=planMilitary(s,'france',command);s=planInvasionFleets(s,'france',command);
  if(s.ships.some(u=>u.order?.job==='sail'))sailed=true;
  if(s.ships.some(u=>u.order?.job==='beachhead')&&!invasionCapacity(s,'france',p.id)){waited=true;assert.ok(!s.armies.some(u=>u.order?.job==='attack'));}
  assert.equal(s.provinces.find(q=>q.id===p.id).owner,owner);
  s.market={complete:true,deals:[],inTransit:[],diplomacy:[]};s=resolveTurn(loadGame(saveGame(s)));
 }
 assert.ok(sailed);assert.ok(waited);assert.ok(s.ships.some(u=>u.location==='home'&&!u.order),'keep domestic cargo');assert.ok(s.pendingLandAttacks?.length);
 s=startLandBattle(loadGame(saveGame(s)));assert.ok(s.activeLandBattle);const a=s.activeLandBattle.attack;
 for(const id of [a.attacker,a.defender])while(!s.activeLandBattle.battle.ready[id===a.attacker?0:1])s=commandLandBattle(s,id,chooseBattleAction(s.activeLandBattle.battle,id));
 let steps=0;while(s.activeLandBattle.battle.phase!=='finished'&&steps++<1200){const b=s.activeLandBattle.battle,id=b.activeSide===0?a.attacker:a.defender;s=commandLandBattle(s,id,chooseBattleAction(b,id));}
 assert.equal(s.activeLandBattle.battle.phase,'finished');assert.equal(s.activeLandBattle.battle.winner,'france');s=finishLandBattle(loadGame(saveGame(s)));assert.equal(s.provinces.find(q=>q.id===p.id).owner,'france');
 s=planInvasionFleets(s,'france',command);assert.ok(!s.ships.some(u=>u.order?.job==='beachhead'&&u.order.province===p.id));
});
test('AI does not discover hidden coast through invasion planning or seize the human fleet',()=>{
 const s=fixture();s.nations.france.revealed=[];assert.equal(invasionObjective(s,'france'),null);assert.equal(planInvasionFleets(s,'france',command),s);assert.equal(planInvasionFleets(s,'england',command),s);
});

test('an invasion cargo shortage recruits a paid ship even without trade demand',async()=>{
 const {merchantTarget,planMerchants}=await import('../ai-merchants.mjs');
 const s=fixture(),n=s.nations.france;s.ships=s.ships.slice(0,1);s.reports=[];
 n.workers=Array.from({length:12},(_,i)=>({id:'w'+i,type:'peasant',fit:true,diet:i%2?'meat':'grain'}));
 for(const [i,t] of s.tiles.filter(t=>t.owner==='france').entries())Object.assign(t,{resource:i%2?'grain':'meat',level:4,rail:true,prospected:true});
 const key=merchantTarget(s,'france');assert.ok(key);const next=planMerchants(s,'france',command);
 assert.equal(next.construction.filter(c=>c.owner==='france'&&c.kind==='ship').length,1);
 for(const [g,q] of Object.entries(SHIPS[key].cost.goods))assert.equal(next.nations.france.stock[g],n.stock[g]-q);
 assert.ok(next.nations.france.workers.length<n.workers.length);
});
test('uncharted invasion route does not disable exploration needed to reach it',async()=>{
 const {planExploration}=await import('../ai-exploration.mjs');const s=fixture();s.nations.france.seenSea=[];Object.assign(s.ships[0],{type:'indiaman',cargo:SHIPS.indiaman.cargo,hp:SHIPS.indiaman.hull});
 const waiting=planInvasionFleets(s,'france',command);assert.ok(!waiting.ships.some(u=>u.order));
 const scouting=planExploration(waiting,'france',command);assert.ok(scouting.ships.some(u=>u.order?.job==='sail'));
});
