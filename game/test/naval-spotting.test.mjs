import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIPS} from '../rules.mjs';
import {navalSpotting} from '../naval-spotting.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-spotting-audit.json',import.meta.url),'utf8'));
test('spotting and random consumption match native speed, hull, size and order branches',()=>{
 assert.equal(audit.cases.length,1860);
 for(const c of audit.cases){
  const sides=c.sides.map(ships=>ships.map(s=>({...s,type:Object.keys(SHIPS).find(k=>SHIPS[k].nativeId===s.nativeId)})));
  const draws=[];const spotted=navalSpotting(sides,c.orders,()=>{draws.push(c.roll);return c.roll;});
  assert.deepEqual({spotted,draws},{spotted:c.spotted,draws:c.draws},JSON.stringify(c));
 }
});
