import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIPS} from '../rules.mjs';
import {navalMovement} from '../naval-movement.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-movement-audit.json',import.meta.url),'utf8'));
test('naval movement weights, distance and random draws match 651 native cases',()=>{
 assert.equal(audit.cases.length,651);
 for(const c of audit.cases){
  const sides=c.sides.map(ships=>ships.map(s=>({...s,type:Object.keys(SHIPS).find(k=>SHIPS[k].nativeId===s.nativeId)}))),draws=[];
  const got=navalMovement(sides,c.direction,c.distance,c.admirals,()=>{const r=c.rolls[draws.length%c.rolls.length];draws.push(r);return r;});
  assert.deepEqual(got,{after:c.after,weights:c.weights},JSON.stringify(c));assert.deepEqual(draws,c.draws);
 }
});
