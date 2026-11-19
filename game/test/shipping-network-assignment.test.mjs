import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {assignShippingNetworks} from '../shipping-network-assignment.mjs';
test('shipping network assignment matches200 complete original executions and cargo counters',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-shipping-network-assignment-audit.json',import.meta.url)));assert.equal(audit.cases.length,200);
 for(const c of audit.cases)assert.deepEqual(assignShippingNetworks(c),c.result);
});
test('safe network is used before endangered network; home and automatic accounting remain distinct',()=>{
 const row=(root,flag,automatic=false)=>({root,flag,automatic,owner:0,potential:5,assigned:2});
 const c={home:0,quantity:7,usedByOwner:[20],records:[row(0,0),row(1,1),row(2,0),row(3,0,true)]},before=structuredClone(c);
 const r=assignShippingNetworks(c);assert.deepEqual(r.assigned,[2,0,5,2]);assert.equal(r.remaining,0);assert.deepEqual(r.usedByOwner,[21]);assert.deepEqual(c,before);
 c.quantity=20;const shortfall=assignShippingNetworks(c);assert.equal(shortfall.remaining,5);
 c.quantity=0;assert.deepEqual(assignShippingNetworks(c).assigned,[2,0,0,0]);
});
