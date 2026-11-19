import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIPS} from '../rules.mjs';
import {navalExchange} from '../naval-exchange.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-exchange-audit.json',import.meta.url),'utf8'));
test('both volleys and RNG ordering match 450 native exchanges',()=>{
 assert.equal(audit.cases.length,450);
 for(const c of audit.cases){
  const sides=c.sides.map(ships=>ships.map(s=>({...s,type:Object.keys(SHIPS).find(k=>SHIPS[k].nativeId===s.nativeId)}))),draws=[],before=structuredClone(sides);
  const after=navalExchange(sides,c.distance,c.admirals,()=>{const r=c.rolls[draws.length%c.rolls.length];draws.push(r);return r;});
  assert.deepEqual(after.map(s=>s.map(u=>u.hp)),c.after,JSON.stringify(c));assert.deepEqual(draws,c.draws);assert.deepEqual(sides,before);
 }
});
test('fatally hit ships return fire before any sinking cleanup',()=>{
 const sides=[[{type:'galleon',hp:1}],[{type:'galleon',hp:1}]];
 const after=navalExchange(sides,1,[0,0],()=>0);
 assert.ok(after[0][0].hp<0);assert.ok(after[1][0].hp<0);
});
