import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIPS} from '../rules.mjs';
import {navalDamage} from '../naval-damage.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-damage-audit.json',import.meta.url),'utf8'));
test('naval hull losses and random consumption match 186 native volleys',()=>{
 assert.equal(audit.cases.length,186);
 for(const c of audit.cases){
  const ships=c.ships.map(s=>({...s,type:Object.keys(SHIPS).find(k=>SHIPS[k].nativeId===s.nativeId)})),before=structuredClone(ships),draws=[];
  const after=navalDamage(ships,c.power,c.hits,()=>{const r=c.rolls[draws.length%c.rolls.length];draws.push(r);return r;});
  assert.deepEqual(after.map(s=>s.hp),c.after,JSON.stringify(c));assert.deepEqual(draws,c.draws);assert.deepEqual(ships,before);
 }
});
test('volley retains sunk targets until battle cleanup and rejects invalid input',()=>{
 const ships=[{id:'a',type:'carrack',hp:1}];
 const after=navalDamage(ships,12,3,()=>0);assert.equal(after.length,1);assert.ok(after[0].hp<0);assert.equal(after[0].id,'a');
 assert.deepEqual(navalDamage(ships,12,0,()=>{throw Error('No RNG expected');}),ships);
 assert.throws(()=>navalDamage([],1,1,()=>0),/volley/);
 assert.throws(()=>navalDamage(ships,1,1,()=>-1),/random/);
});
