import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {firstShippingAllocation} from '../shipping-first-pass.mjs';
test('first shipping pass matches160 original sorted capacity-limited allocations',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-shipping-first-pass-audit.json',import.meta.url)));assert.equal(audit.cases.length,160);
 for(const c of audit.cases)assert.deepEqual(firstShippingAllocation(c),{allocations:c.allocations,used:c.used,calls:c.calls});
});
test('shipping eligibility distinguishes riches, warehouse shortages and steel from food/raw goods',()=>{
 const c={capacity:100,weights:Array(28).fill(1),available:Array(28).fill(2),stock:Array(28).fill(5),demand:Array(28).fill(5)};
 c.weights[23]=1.00001;c.stock[12]=4;const before=structuredClone(c),r=firstShippingAllocation(c);
 assert.deepEqual(r.allocations.map((q,i)=>q?i:null).filter(i=>i!==null),[12,16,23]);assert.equal(r.used,6);assert.deepEqual(c,before);
 c.weights[23]=1+1e-9;assert.equal(firstShippingAllocation(c).allocations[23],0);
 c.capacity=0;assert.deepEqual(firstShippingAllocation(c).calls,[]);
});
