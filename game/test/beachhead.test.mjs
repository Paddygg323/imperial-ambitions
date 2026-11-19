import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame,beginTurn} from '../engine.mjs';
import {resolveArmies} from '../army.mjs';
import {invasionCapacity} from '../beachhead.mjs';
function fixture(options={}){
 const s=createGame(options),ship=s.ships.find(u=>u.owner==='england');
 const target=s.provinces.find(p=>!p.old&&s.seas.zones.some(z=>z.coast.some(id=>s.tiles.some(t=>t.id===id&&t.province===p.id)))) ;
 const zone=s.seas.zones.find(z=>z.coast.some(id=>s.tiles.some(t=>t.id===id&&t.province===target.id)));
 ship.location=zone.id;s.nations.england.revealed.push(...zone.coast);
 const source=s.tiles.find(t=>t.id===s.nations.england.capital).province;
 s.armies=[{id:'invader',owner:'england',province:source,type:'pikeman',hp:100,order:null}];
 return {s,ship,target};
}
test('beachhead waits a full turn then permits a port-based overseas attack without instant conquest',()=>{
 let {s,ship,target}=fixture();s=command(s,'england',{type:'fleet',job:'beachhead',ships:[ship.id],province:target.id});
 const attack={type:'army',job:'attack',units:['invader'],province:target.id};
 assert.throws(()=>command(s,'england',attack),/established beachhead/);assert.equal(invasionCapacity(s,'england',target.id),0);
 s.turn++;s=loadGame(saveGame(s));assert.equal(invasionCapacity(s,'england',target.id),ship.cargo);
 s=command(s,'england',attack);resolveArmies(s);assert.equal(s.pendingLandAttacks[0].province,target.id);assert.equal(s.provinces.find(p=>p.id===target.id).owner,target.owner);
});
test('lost or cancelled landing ships cancel the ordered attack before combat',()=>{
 for(const remove of [true,false]){let {s,ship,target}=fixture();s=command(s,'england',{type:'fleet',job:'beachhead',ships:[ship.id],province:target.id});s.turn++;
 s=command(s,'england',{type:'army',job:'attack',units:['invader'],province:target.id});
 if(remove)s.ships=[];else s=command(s,'england',{type:'fleet',job:'cancel',ships:[ship.id]});
 resolveArmies(s);assert.deepEqual(s.pendingLandAttacks,[]);assert.equal(s.armies[0].order,null);}
});
test('landing capacity restricts invasions',()=>{
 let {s,ship,target}=fixture();s=command(s,'england',{type:'fleet',job:'beachhead',ships:[ship.id],province:target.id});s.turn++;
 s.ships.find(u=>u.id===ship.id).cargo=0;assert.throws(()=>command(s,'england',{type:'army',job:'attack',units:['invader'],province:target.id}),/cargo hold/);
});

for(const transportModel of ['legacy','ports'])test(`${transportModel}: overseas campaign resolves preparation, defended battle, conquest and economy through real turns`,async()=>{
 const {resolveTurn}=await import('../engine.mjs');
 const {startLandBattle,commandLandBattle,finishLandBattle}=await import('../campaign-battle.mjs');
 const {chooseBattleAction}=await import('../battle-ai.mjs');
 let {s,ship,target}=fixture({transportModel,preferenceSeed:123});target.fort=0;s.armies[0].type='regular';s.armies[0].experience=100;
 const advance=state=>{
  let next=beginTurn(state),decisions=0;
  while(next.pendingDiplomacy){
   assert.ok(decisions++<6);assert.ok(!next.pendingWarCalls?.length,'No unsolicited war commitment');
   for(const offer of [...(next.incomingAlliances??[])])next=command(next,'england',{type:'respondAlliance',proposer:offer.proposer,accept:false});
   for(const offer of [...(next.incomingPeace??[])])next=command(next,'england',{type:'respondPeace',proposer:offer.proposer,accept:false});
   next=beginTurn(loadGame(saveGame(next)));
  }
  return resolveTurn(next);
 };
 s.armies.push({id:'native-defender',owner:target.owner,province:target.id,type:'pikeman',hp:50,experience:0,order:null});
 s=command(s,'england',{type:'fleet',job:'beachhead',ships:[ship.id],province:target.id});
 s=advance(s);assert.equal(s.turn,1);assert.ok(invasionCapacity(s,'england',target.id)>0);
 s=loadGame(saveGame(s));s=command(s,'england',{type:'army',job:'attack',units:['invader'],province:target.id});
 s=advance(s);assert.equal(s.turn,1);assert.equal(s.turnPhase,'combat');
 s=startLandBattle(loadGame(saveGame(s)));const attack=s.activeLandBattle.attack;
 for(const nation of [attack.attacker,attack.defender])while(!s.activeLandBattle.battle.ready[nation===attack.attacker?0:1])s=commandLandBattle(s,nation,chooseBattleAction(s.activeLandBattle.battle,nation));
 let actions=0;
 while(s.activeLandBattle.battle.phase!=='finished'&&actions++<600){s=loadGame(saveGame(s));const b=s.activeLandBattle.battle,nation=b.activeSide===0?attack.attacker:attack.defender;s=commandLandBattle(s,nation,chooseBattleAction(b,nation));}
 assert.equal(s.activeLandBattle.battle.phase,'finished');assert.equal(s.activeLandBattle.battle.winner,'england');
 s=finishLandBattle(s);assert.equal(s.turn,2);assert.equal(s.turnPhase,undefined);assert.equal(s.provinces.find(p=>p.id===target.id).owner,'england');assert.equal(s.armies.find(u=>u.id==='invader').province,target.id);
 assert.ok(s.tiles.filter(t=>t.province===target.id).every(t=>t.owner==='england'));
 assert.throws(()=>finishLandBattle(s),/No active/);assert.equal(loadGame(saveGame(s)).turn,2);
});

for(const interceptor of ['patrol','sail'])test(`a surviving landing fleet driven off by ${interceptor} cannot invade, survives reload, and can retry later`,async()=>{
 const {resolveFleets}=await import('../navy.mjs');
 let {s,ship,target}=fixture();s.seed=1;s.turn=1;
 ship.type='galleon';ship.hp=50;ship.cargo=6;ship.aggression=0;
 ship.order={job:'beachhead',fleet:'landing',province:target.id,readyTurn:1};
 s.ships=[ship,{id:'enemy-patrol',owner:'portugal',type:'galleon',hp:50,cargo:6,location:ship.location,order:interceptor==='patrol'?{job:'patrol',fleet:'enemy'}:{job:'sail',fleet:'enemy',destination:ship.location,path:[ship.location]}}];
 s.wars=[['england','portugal']];
 s=command(s,'england',{type:'army',job:'attack',units:['invader'],province:target.id});
 assert.equal(invasionCapacity(s,'england',target.id),6);
 resolveFleets(s);
 assert.ok(s.ships.some(u=>u.id===ship.id&&u.owner==='england'&&u.hp>0),'retreat leaves actual survivors');
 assert.ok(s.reports.some(r=>r.kind==='beachheadInterrupted'));
 s=loadGame(saveGame(s));assert.equal(invasionCapacity(s,'england',target.id),0);
 resolveArmies(s);assert.deepEqual(s.pendingLandAttacks,[]);assert.equal(s.armies[0].order,null);
 s.turn++;s.ships=s.ships.filter(u=>u.owner==='england');resolveFleets(s);
 assert.equal(invasionCapacity(s,'england',target.id),6);
 s=command(s,'england',{type:'army',job:'attack',units:['invader'],province:target.id});resolveArmies(s);
 assert.equal(s.pendingLandAttacks[0].province,target.id);
});

test('mixed land and overseas attack reserves holds only for remote troops and preserves land attack after fleet loss',async()=>{
 const {provinceAdjacency}=await import('../world.mjs');
 for(const lost of [false,true])for(const together of [false,true]){
  let {s,ship,target}=fixture();
  const adjacent=[...provinceAdjacency(s)[target.id]][0];assert.ok(adjacent);
  const source=s.provinces.find(p=>p.id===adjacent);source.owner='england';
  for(const t of s.tiles.filter(t=>t.province===adjacent)){t.owner='england';t.port=false;delete t.transportSeaTile;}
  s.armies.push({id:'land-contingent',owner:'england',province:adjacent,type:'pikeman',hp:100,order:null});
  ship.cargo=1;ship.order={job:'beachhead',fleet:'landing',province:target.id,readyTurn:0};
  // An already ordered land regiment must not consume the single available hold.
  if(together)s=command(s,'england',{type:'army',job:'attack',units:['land-contingent','invader'],province:target.id});
  else{
   s=command(s,'england',{type:'army',job:'attack',units:['land-contingent'],province:target.id});
   s=command(s,'england',{type:'army',job:'attack',units:['invader'],province:target.id});
  }
  s=loadGame(saveGame(s));if(lost)s.ships=[];
  resolveArmies(s);
  assert.equal(s.pendingLandAttacks.length,1);
  assert.deepEqual(s.pendingLandAttacks[0].attackers.map(a=>a.id).sort(),lost?['land-contingent']:['invader','land-contingent']);
  if(lost)assert.equal(s.armies.find(u=>u.id==='invader').order,null);
 }
});
