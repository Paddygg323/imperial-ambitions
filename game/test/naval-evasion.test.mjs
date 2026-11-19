import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIPS} from '../rules.mjs';
import {navalEncounter} from '../naval-encounter.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-evasion-audit.json',import.meta.url),'utf8'));
test('prebattle acceptance and evasion match native aggression, strength, speed and orders',()=>{
 assert.equal(audit.cases.length,1026);
 for(const c of audit.cases){
  const sides=c.sides.map(ships=>ships.map(s=>({...s,type:Object.keys(SHIPS).find(k=>SHIPS[k].nativeId===s.nativeId)})));
  const draws=[];const result=navalEncounter(sides,c.orders,c.aggression,c.initialEscaped,()=>{draws.push(c.roll);return c.roll;});
  assert.deepEqual({...result,draws},{battle:c.battle,escaped:c.escaped,draws:c.draws},JSON.stringify(c));
 }
});
