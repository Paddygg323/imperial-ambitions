import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {allocationPriorityOrder} from '../allocation-priority-order.mjs';
test('allocation order matches160 complete original heap-sort executions including ties',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-allocation-priority-sort-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,160);
 for(const c of audit.cases)assert.deepEqual(allocationPriorityOrder(c.weights),c.order);
});
test('float32 ties follow native order and invalid inputs cannot silently rank',()=>{
 const weights=Array(28).fill(1),before=[...weights];weights[0]=1+1e-9;
 assert.deepEqual(allocationPriorityOrder(weights),allocationPriorityOrder(before));assert.equal(weights[0],1+1e-9);
 for(const value of [[],Array(28).fill(NaN),Array(28).fill(Infinity),Array(28).fill(1e100)])assert.throws(()=>allocationPriorityOrder(value),/weights/);
});
