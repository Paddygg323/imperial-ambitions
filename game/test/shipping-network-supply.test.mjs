import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {shippingNetworkSupply} from '../shipping-network-supply.mjs';
test('shipping supply matches800 original signed-short network queries',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-shipping-network-supply-audit.json',import.meta.url)));assert.equal(audit.cases.length,200);
 for(const c of audit.cases)assert.deepEqual(shippingNetworkSupply(c.records,c.home),c.result);
});
test('home duplicates do not double count and automatic potential differs from assigned port supply',()=>{
 const r=(root,potential,assigned,automatic=false,flag=0)=>({root,potential,assigned,automatic,flag});
 const records=[r(0,4,0),r(0,90,90),r(1,8,2),r(2,5,1,true,1)],before=structuredClone(records);
 assert.deepEqual(shippingNetworkSupply(records,0),{home:4,available:13,assigned:7,incoming:11});assert.deepEqual(records,before);
 records[2].assigned=6;assert.equal(shippingNetworkSupply(records,0).incoming,15);
});
