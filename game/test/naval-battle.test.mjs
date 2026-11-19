import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIPS} from '../rules.mjs';
import {createNavalBattle,stepNavalBattle,navalWinner} from '../naval-battle.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-result-audit.json',import.meta.url),'utf8'));
test('naval winner matches all sixteen native elimination/retreat combinations',()=>{
 for(const c of audit.cases)assert.equal(navalWinner(c.eliminated,c.retreat),c.winner);
});
function fixture(a,b,seed){return createNavalBattle({sides:[[ {id:'a',owner:'england',type:a,hp:SHIPS[a].hull}],[{id:'b',owner:'france',type:b,hp:SHIPS[b].hull}]],nations:[{id:'england',known:[]},{id:'france',known:['54']}],seed});}
test('complete naval encounters terminate, conserve identities, and survive every-round reload',()=>{
 const reasons=new Set();
 for(const [a,b] of [['galleon','galleon'],['ironclad','carrack'],['carrack','ironclad'],['frigate','shipOfTheLine']])for(const seed of [1,17,999]){
  let direct=fixture(a,b,seed),reloaded=structuredClone(direct);const initial=JSON.stringify(direct);
  for(let i=0;direct.phase==='active'&&i<51;i++){
   const previous=JSON.stringify(direct);const next=stepNavalBattle(direct);assert.equal(JSON.stringify(direct),previous);direct=next;
   reloaded=stepNavalBattle(JSON.parse(JSON.stringify(reloaded)));assert.deepEqual(reloaded,direct);
  }
  assert.equal(direct.phase,'finished');assert.ok(direct.rounds<=50);reasons.add(direct.reason);
  const all=[...direct.sides.flat(),...direct.captured,...direct.sunk];assert.deepEqual(all.map(s=>s.id).sort(),['a','b']);
  assert.ok(direct.sides.flat().every(s=>s.hp>0));assert.ok(direct.captured.every(s=>s.hp===1));
  assert.throws(()=>stepNavalBattle(direct),/finished/);assert.notEqual(JSON.stringify(direct),initial);
 }
 assert.ok(reasons.has('escaped'));assert.ok(reasons.has('fleetLost'));
});
test('fiftieth surviving exchange ends the encounter without inventing a winner',()=>{
 let b=fixture('galleon','galleon',1);b.aggression=[2,2];b.rounds=49;b=stepNavalBattle(b);
 assert.equal(b.phase,'finished');assert.equal(b.reason,'limit');assert.equal(b.rounds,50);assert.equal(b.winner,null);
});

test('completed encounters award winner experience once and preserve it in saved result',()=>{
 let b=fixture('ironclad','carrack',1);const initial=b.initial;
 for(let i=0;b.phase==='active'&&i<51;i++)b=stepNavalBattle(b);
 assert.equal(b.phase,'finished');assert.equal(b.winner,0);
 const enemy=1,value=5*(initial[enemy]-b.sides[enemy].length)+b.sides[enemy].length;
 assert.equal(b.sides[0][0].experience,3*value);
 const saved=JSON.stringify(b);assert.throws(()=>stepNavalBattle(JSON.parse(saved)),/finished/);assert.equal(JSON.stringify(b),saved);
});
