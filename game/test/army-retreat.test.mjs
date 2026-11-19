import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chooseDefenderRetreat,planBattleRetreats} from '../army-retreat.mjs';
const reference=JSON.parse(readFileSync(new URL('./native-defender-retreat.json',import.meta.url)));
test('defender retreat selection matches native ownership and RNG cases',()=>{
 for(const c of reference.cases){
  const result=chooseDefenderRetreat([1,2,3],id=>c.owners[id-1],1,c.roll);
  assert.equal(result,c.destination);assert.equal(c.destroyed,result===null?2:0);
 }
 assert.equal(chooseDefenderRetreat([],()=>1,1,0),null);
 assert.throws(()=>chooseDefenderRetreat([],()=>1,1,-1),/random/);
});
test('defeated attackers retain individual sources and health without teleportation',()=>{
 const s={provinces:[{id:'a',owner:'england'},{id:'b',owner:'england'}]};
 const attack={province:'c',attacker:'england',defender:'france',attackers:[{id:'one',from:'a'},{id:'two',from:'b'}]};
 const result={province:'c',winner:'france',armies:{england:{survivors:[{id:'one',hp:16},{id:'two',hp:50}]}}};
 const before=JSON.stringify({s,attack,result});
 assert.deepEqual(planBattleRetreats(s,attack,result,0),[{id:'one',province:'a',destroyed:false},{id:'two',province:'b',destroyed:false}]);
 assert.equal(JSON.stringify({s,attack,result}),before);
 s.provinces[0].owner='france';assert.throws(()=>planBattleRetreats(s,attack,result,0),/ownership changed/);
});
import {createGame} from '../engine.mjs';
import {provinceAdjacency} from '../world.mjs';
test('historical-map defenders retreat together only into adjacent owned land',()=>{
 const s=createGame(),adj=provinceAdjacency(s);
 const target=s.provinces.find(p=>adj[p.id].size>=2);
 const neighbours=[...adj[target.id]];
 for(const p of s.provinces)p.owner='england';
 target.owner='france';s.provinces.find(p=>p.id===neighbours[0]).owner='france';
 const attack={province:target.id,attacker:'england',defender:'france',attackers:[]};
 const result={province:target.id,winner:'england',armies:{france:{survivors:[{id:'d1',hp:21},{id:'d2',hp:87}]}}};
 const plan=planBattleRetreats(JSON.parse(JSON.stringify(s)),attack,result,15);
 assert.deepEqual(plan.map(p=>p.province),[neighbours[0],neighbours[0]]);assert.ok(plan.every(p=>!p.destroyed));
 s.provinces.find(p=>p.id===neighbours[0]).owner='england';
 // Even a distant friendly province cannot rescue encircled defenders.
 s.provinces.find(p=>p.id!==target.id&&!adj[target.id].has(p.id)).owner='france';
 assert.ok(planBattleRetreats(s,attack,result,0).every(p=>p.destroyed&&p.province===null));
});
