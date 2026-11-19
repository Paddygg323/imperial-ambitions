import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {planMilitary} from '../ai-military.mjs';import {planInvasionFleets,invasionObjective} from '../ai-invasion.mjs';
import {invasionCapacity} from '../beachhead.mjs';import {TECHS,SHIPS} from '../rules.mjs';
import {startLandBattle,commandLandBattle,finishLandBattle} from '../campaign-battle.mjs';import {chooseBattleAction} from '../battle-ai.mjs';
function fixture(){const s=createGame(),n=s.nations.france;s.wars=[];s.civilians=[];s.construction=[];
 s.provinces.find(p=>p.id===s.tiles.find(t=>t.id===s.nations.england.capital).province).fort=2;
 n.known=Object.keys(TECHS);n.cash=20000;n.seenSea=s.seas.zones.map(z=>z.id);n.revealed=s.tiles.filter(t=>s.provinces.find(p=>p.id===t.province)?.old).map(t=>t.id);for(const g of Object.keys(n.stock))n.stock[g]=100;
 n.workers=Array.from({length:12},(_,i)=>({id:'colonial-worker'+i,type:'peasant',fit:true,diet:i%2?'grain':'meat'}));
 const target=s.provinces.find(p=>!p.old&&s.seas.zones.some(z=>z.coast.some(tid=>s.tiles.some(t=>t.id===tid&&t.province===p.id))));target.fort=0;
 const crop=s.tiles.find(t=>t.province===target.id);crop.resource='sugarCane';crop.terrain=15;crop.prospected=true;n.revealed.push(...s.tiles.filter(t=>t.province===target.id).map(t=>t.id));
 const source=s.tiles.find(t=>t.id===n.capital).province;s.armies=Array.from({length:8},(_,i)=>({id:'a'+i,owner:'france',province:source,type:i<6?'musketeer':'royalArtillery',hp:100,experience:0,order:null}));
 // Newly discovered crop provinces also need a defender: this fixture is
 // intended to exercise a battle, not an uncontested coastal occupation.
 for(const p of s.provinces.filter(p=>!p.old&&!s.nations[p.owner]))s.armies.push({id:'tribal-defender-'+p.id,owner:p.owner,province:p.id,type:'levy',hp:100,experience:0,order:null});
 s.ships=Array.from({length:3},(_,i)=>({id:'transport'+i,owner:'france',type:'galleon',cargo:SHIPS.galleon.cargo,hp:SHIPS.galleon.hull,location:'home',order:null}));return s;}
test('AI secures a visible tribal crop through sailing, beachhead delay and actual saved battle',()=>{
 let s=fixture(),p=invasionObjective(s,'france');assert.ok(p);let owner=p.owner;assert.equal(p.old,false);assert.equal(s.wars.length,0);let waited=false,sailed=false;
 for(let turn=0;turn<40&&!s.pendingLandAttacks?.length;turn++){
  // End-of-turn adjacent-sea discovery may reveal a better crop province.
  // Check the actual current objective, rather than the opening fog snapshot.
  p=invasionObjective(s,'france');assert.ok(p);owner=p.owner;
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
test('supply objectives respect discovery, investors, existing holdings and ongoing wars',async()=>{
 const {overseasSupplyObjective}=await import('../ai-overseas-supply.mjs');
 const {campaignObjective,planCampaignDeclaration}=await import('../ai-campaign.mjs');
 const s=fixture(),p=invasionObjective(s,'france'),coasts=new Set([p.id]),n=s.nations.france;
 assert.equal(overseasSupplyObjective(s,'france',coasts)?.id,p.id);
 assert.equal(planCampaignDeclaration(s,'france',()=>{throw Error('unnecessary tribal declaration');}),s);
 n.revealed=n.revealed.filter(tid=>!s.tiles.some(t=>t.id===tid&&t.province===p.id));
 assert.equal(overseasSupplyObjective(s,'france',coasts),null);
 n.revealed.push(...s.tiles.filter(t=>t.province===p.id).map(t=>t.id));
 const crop=s.tiles.find(t=>t.province===p.id&&t.resource==='sugarCane');crop.purchasedBy='england';
 assert.equal(overseasSupplyObjective(s,'france',coasts),null,'do not provoke an investing Great Power');
 delete crop.purchasedBy;
 n.known=n.known.filter(k=>!['42','62'].includes(k));
 const own=s.tiles.find(t=>t.owner==='france');own.resource='sugarCane';own.terrain=15;own.level=0;
 assert.notEqual(overseasSupplyObjective(s,'france',coasts)?.id,p.id,'develop an owned source before another acquisition');
 own.resource=null;s.wars=[['france','spain']];assert.notEqual(campaignObjective(s,'france')?.id,p.id);
});
