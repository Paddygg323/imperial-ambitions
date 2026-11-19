import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {materialAdvance} from '../material-advance.mjs';import {cityReceipt} from '../city-receipt.mjs';
test('material advances and repayment match 1000 original calls',()=>{
 const a=JSON.parse(readFileSync(new URL('../../outputs/Native-material-advance-audit.json',import.meta.url)));
 assert.equal(a.cases.length,500);let accepted=0,rejected=0;
 for(const c of a.cases){
  const before=structuredClone(c),r=materialAdvance(c);assert.deepEqual(r,c.result);assert.deepEqual(c,before);
  assert.deepEqual(cityReceipt({...r,delivery:c.delivery}),c.receipt);
  r.accepted?accepted++:rejected++;
 }
 assert.ok(accepted>0&&rejected>0);
});
