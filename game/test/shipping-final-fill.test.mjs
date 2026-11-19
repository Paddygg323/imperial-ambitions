import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {finalShippingFill} from '../shipping-final-fill.mjs';
test('final shipping fill matches200 original complete looping passes',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-shipping-final-fill-audit.json',import.meta.url)));assert.equal(audit.cases.length,200);
 for(const [i,c] of audit.cases.entries())assert.deepEqual(finalShippingFill(c),c.result,'native case '+i);
});
test('native fill skips locked cotton and preserves two-unit request boundary',()=>{
 const c={capacity:1,used:0,reserve:0,cotton:false,weights:Array(28).fill(1),available:Array(28).fill(0),allocations:Array(28).fill(0)};
 c.available[6]=3;assert.equal(finalShippingFill(c).added,0);c.cotton=true;assert.equal(finalShippingFill(c).added,1);
 c.available[6]=0;c.available[5]=3;const before=structuredClone(c),r=finalShippingFill(c);
 assert.equal(r.budget,1);assert.equal(r.added,2);assert.equal(r.allocations[5],2);assert.deepEqual(c,before);
});
