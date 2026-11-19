import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIPS} from '../rules.mjs';
import {repairedHull} from '../ship-repair.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-ship-repair-audit.json',import.meta.url),'utf8'));
test('ship repair matches all 510 executable captures across twelve ship types',()=>{
 assert.equal(audit.cases.length,510);
 assert.equal(new Set(audit.cases.map(c=>c.nativeId)).size,12);
 for(const c of audit.cases){
  const [type,ship]=Object.entries(SHIPS).find(([,v])=>v.nativeId===c.nativeId);
  assert.equal(ship.hull,c.hull);assert.equal(repairedHull(type,c.before),c.after,`${type} hull ${c.before}`);
 }
});
test('repair cannot resurrect a sunk ship or accept invalid hull',()=>{
 for(const hp of [0,-1,26,1.5,NaN])assert.throws(()=>repairedHull('carrack',hp),/living ship/);
 assert.throws(()=>repairedHull('unknown',1),/living ship/);
});
