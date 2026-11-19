import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {topUpShippingFood} from '../shipping-food-topup.mjs';
test('aggregate food top-up matches200 original capacity, stock and supply cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-shipping-food-topup-audit.json',import.meta.url)));assert.equal(audit.cases.length,200);
 for(const c of audit.cases)assert.deepEqual(topUpShippingFood(c),c.result);
});
test('aggregate fallback takes grain then meat then fish and includes existing incoming food',()=>{
 const c={capacity:20,used:2,stock:Array(28).fill(0),demand:Array(28).fill(0),incoming:Array(28).fill(0),allocations:Array(28).fill(0),remainingFood:[2,7,3]};
 c.demand[20]=5;c.demand[22]=5;c.incoming[20]=2;c.allocations[20]=2;
 const before=structuredClone(c),r=topUpShippingFood(c);
 assert.deepEqual(r.calls,[[20,4],[22,3],[21,3]]);assert.equal(r.used,10);assert.deepEqual(c,before);
 c.stock[21]=8;assert.deepEqual(topUpShippingFood(c).calls,[]);
});
