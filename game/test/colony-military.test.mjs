import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame,transport} from '../engine.mjs';
import {provinceAdjacency} from '../world.mjs';
import {militaryController} from '../province-control.mjs';
import {resolveArmies} from '../army.mjs';
import {planLandAttack} from '../land-attack.mjs';
import {startLandBattle,finishLandBattle} from '../campaign-battle.mjs';
import {beachheadTarget} from '../beachhead.mjs';
import {planBattleRetreats} from '../army-retreat.mjs';
function fixture(){
 const s=createGame({transportModel:'ports'}),adj=provinceAdjacency(s);
 const target=s.provinces.find(p=>!p.old&&[...adj[p.id]].some(id=>{const q=s.provinces.find(p=>p.id===id);return !q.old&&q.owner!==p.owner;}));
 const source=s.provinces.find(p=>adj[target.id].has(p.id)&&!p.old&&p.owner!==target.owner);
 s.minors[target.owner].colonyOf='england';source.owner='france';for(const t of s.tiles)if(t.province===source.id)t.owner='france';
 s.armies=[{id:'a',owner:'france',province:source.id,type:'pikeman',hp:100,experience:0,order:null},{id:'d',owner:'england',province:target.id,type:'pikeman',hp:100,experience:0,order:null}];
 return {s,target,source};
}
test('parent redeployment into a colony survives reload without changing economic ownership',()=>{
 let {s,target,source}=fixture();const home=s.provinces.find(p=>p.owner==='england');s.armies[1].province=home.id;
 const before=transport(s,'england').incoming,owners=s.tiles.filter(t=>t.province===target.id).map(t=>t.owner);
 s=command(s,'england',{type:'army',job:'deploy',units:['d'],province:target.id});s=loadGame(saveGame(s));resolveArmies(s);
 assert.equal(s.armies.find(u=>u.id==='d').province,target.id);
 assert.deepEqual(s.tiles.filter(t=>t.province===target.id).map(t=>t.owner),owners);assert.deepEqual(transport(s,'england').incoming,before);
 assert.throws(()=>planLandAttack(s,'england',['d'],target.id),/foreign province/);
 s.wars=[['england','france']];assert.equal(planLandAttack(s,'england',['d'],source.id).defender,'france');
});
test('colony attacks require war with parent and include parent regiments in battle',()=>{
 let {s,target}=fixture();assert.throws(()=>planLandAttack(s,'france',['a'],target.id),/Declare war/);
 s.wars=[['france','england']];const attack=planLandAttack(s,'france',['a'],target.id);
 assert.equal(attack.defender,'england');assert.equal(attack.provinceOwner,target.owner);assert.deepEqual(attack.defenders,['d']);
 s.armies[0].order={job:'attack',province:target.id};s.pendingLandAttacks=[attack];
 s=startLandBattle(loadGame(saveGame(s)));assert.equal(s.activeLandBattle.battle.defender,'england');
 // Controlled result fixture tests campaign application, not tactical balance.
 s.activeLandBattle.battle.phase='finished';s.activeLandBattle.battle.winner='england';
 const done=finishLandBattle(loadGame(saveGame(s)));
 assert.equal(done.provinces.find(p=>p.id===target.id).owner,target.owner);
 assert.equal(done.armies.find(u=>u.id==='d').province,target.id);assert.ok(done.reports.some(r=>r.nation==='england'&&r.kind==='battle'));
});
test('beachhead cannot target own colony and foreign parent war is required',()=>{
 const s=createGame(),target=s.provinces.find(p=>!p.old&&s.seas.zones.some(z=>z.coast.some(id=>s.tiles.some(t=>t.id===id&&t.province===p.id))));
 const zone=s.seas.zones.find(z=>z.coast.some(id=>s.tiles.some(t=>t.id===id&&t.province===target.id)));
 s.minors[target.owner].colonyOf='england';for(const id of ['england','france'])s.nations[id].revealed.push(...zone.coast);
 assert.throws(()=>beachheadTarget(s,'england',target.id,zone.id),/foreign coastal/);
 assert.throws(()=>beachheadTarget(s,'france',target.id,zone.id),/Declare war/);
 s.wars=[['france','england']];assert.equal(beachheadTarget(s,'france',target.id,zone.id),target);
 s.nations.england.alive=false;assert.equal(militaryController(s,target),target.owner);
});

test('attacker can retreat to its colony; loss of parent control invalidates the source',()=>{
 const {s,target,source}=fixture();s.wars=[['england','france']];
 const attack=planLandAttack(s,'england',['d'],source.id);
 const result={province:source.id,winner:'france',armies:{england:{survivors:[{id:'d',hp:20}]}}};
 assert.deepEqual(planBattleRetreats(s,attack,result,0),[{id:'d',province:target.id,destroyed:false}]);
 s.minors[target.owner].colonyOf='spain';assert.throws(()=>planBattleRetreats(s,attack,result,0),/ownership changed/);
});

test('conquest after colonial battle transfers only captured land and preserves other colonial ownership',()=>{
 let {s,target}=fixture();s.wars=[['france','england']];s.armies[0].order={job:'attack',province:target.id};
 s.pendingLandAttacks=[planLandAttack(s,'france',['a'],target.id,{existingOrder:true})];s=startLandBattle(s);
 s.activeLandBattle.battle.phase='finished';s.activeLandBattle.battle.winner='france';
 const others=s.provinces.filter(p=>p.owner===target.owner&&p.id!==target.id).map(p=>p.id);
 const done=finishLandBattle(loadGame(saveGame(s)));
 assert.equal(done.provinces.find(p=>p.id===target.id).owner,'france');
 for(const id of others)assert.equal(done.provinces.find(p=>p.id===id).owner,target.owner);
 assert.ok(done.tiles.filter(t=>t.province===target.id).every(t=>t.owner==='france'));
 assert.ok(done.nations.england.alive,'Colony capital loss is not parent capital loss');
 loadGame(saveGame(done));
});

test('parent troops can launch an established overseas invasion from a colonial port',()=>{
 const s=createGame(),adj=provinceAdjacency(s),source=s.provinces.find(p=>!p.old&&s.minors[p.owner]?.capital===p.town);
 s.minors[source.owner].colonyOf='england';
 const target=s.provinces.find(p=>!p.old&&p.owner!==source.owner&&!adj[source.id].has(p.id)&&s.seas.zones.some(z=>z.coast.some(id=>s.tiles.some(t=>t.id===id&&t.province===p.id))));
 const zone=s.seas.zones.find(z=>z.coast.some(id=>s.tiles.some(t=>t.id===id&&t.province===target.id)));
 s.nations.england.revealed.push(...zone.coast);
 const ship=s.ships.find(u=>u.owner==='england'&&u.cargo>0);ship.location=zone.id;ship.order={job:'beachhead',province:target.id,readyTurn:s.turn};
 s.armies=[{id:'colonial-invader',owner:'england',province:source.id,type:'pikeman',hp:100,experience:0,order:null}];
 assert.equal(planLandAttack(s,'england',['colonial-invader'],target.id).attackers[0].from,source.id);
 ship.order.readyTurn=s.turn+1;assert.throws(()=>planLandAttack(s,'england',['colonial-invader'],target.id),/established beachhead/);
});
