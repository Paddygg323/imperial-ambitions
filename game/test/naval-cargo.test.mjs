import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {navalCargoReport} from '../naval-cargo.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-merchant-cargo-audit.json',import.meta.url),'utf8'));
test('postbattle cargo report counts match native branches including quantity50/51 boundary',()=>{
 assert.equal(audit.cases.length,780);
 for(const c of audit.cases){const draws=[];const result=navalCargoReport({initialCargo:c.initial,survivingCargo:c.remaining,quantity:c.quantity,nation:{known:c.effect===65?['54']:[]}},()=>{draws.push(c.roll);return c.roll;});
  assert.deepEqual({...result,draws},{reportedLost:c.reportedLost,captured:c.captured,draws:c.draws},JSON.stringify(c));
 }
});
