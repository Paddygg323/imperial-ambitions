import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {openingShippingAllocation} from '../shipping-opening-passes.mjs';
test('both opening shipping passes match180 original executions including food branches',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-shipping-opening-passes-audit.json',import.meta.url)));assert.equal(audit.cases.length,180);
 for(const [i,c] of audit.cases.entries())assert.deepEqual(openingShippingAllocation(c),{allocations:c.allocations,calls:c.calls,used:c.used,remainingFood:c.remainingFood},'native case '+i);
});
test('protein shortage uses fish first and preserves inputs without claiming deliveries',()=>{
 const c={capacity:10,steel:false,weights:Array(28).fill(0),available:Array(28).fill(0),home:Array(28).fill(0),stock:Array(28).fill(0),demand:Array(28).fill(0)};
 c.weights[22]=10;c.available[21]=3;c.available[22]=7;c.home[21]=1;c.demand[22]=5;
 const before=structuredClone(c),r=openingShippingAllocation(c);
 assert.equal(r.allocations[21],3);assert.equal(r.allocations[22],2);assert.equal(r.used,5);assert.deepEqual(r.remainingFood,[0,0,5]);assert.deepEqual(c,before);
 c.capacity=2;const limited=openingShippingAllocation(c);assert.equal(limited.used,2);assert.equal(limited.allocations[21],2);assert.equal(limited.allocations[22],0);
});
