import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {allocateShippingNetworks} from '../shipping-network-allocation.mjs';
import {shippingNetworkReceipt} from '../shipping-network-receipt.mjs';
test('connected allocator matches100 complete original scenarios with real network getters and assignments',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-shipping-complete-network-audit.json',import.meta.url)));assert.equal(audit.cases.length,100);
 for(const [i,c] of audit.cases.entries()){const before=structuredClone(c);assert.deepEqual(allocateShippingNetworks(c),c.result,'native case '+i);assert.deepEqual(c,before);}
});
test('city receives allocated network snapshot exactly as original, without a second capacity clamp',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-shipping-complete-network-audit.json',import.meta.url)));
 for(const [i,c] of audit.cases.entries()){
  const allocation=allocateShippingNetworks(c);
  const records=c.records.map((r,j)=>({...r,assigned:allocation.assigned[j]}));
  const {delivery,...receipt}=shippingNetworkReceipt({...c,records});
  assert.deepEqual(receipt,c.receipt,'native receipt '+i);
  if(i===99){assert.equal(c.capacity,1);assert.equal(delivery[5],2);assert.equal(receipt.stock[5],5);}
 }
});
