import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {resourceNetworkAllocation} from '../resource-network-allocation.mjs';
import {countryItemPotential} from '../country-potential.mjs';
test('network resource allocations match225 native development/route/previous-use executions',()=>{
 const data=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-network-allocation-audit.json',import.meta.url)));
 assert.equal(data.cases.length,225);
 for(const c of data.cases)assert.deepEqual(resourceNetworkAllocation(c),{allocated:c.allocated,usedAfter:c.usedAfter},JSON.stringify(c));
});
test('overlapping networks share finite resource production rather than duplicating it',()=>{
 let used=0;const records=[];
 for(const [region,capacity] of [[0,1],[1,2],[2,4]]){
  const result=resourceNetworkAllocation({development:4,capacity,used});used=result.usedAfter;
  records.push({region,quantity:result.allocated});
 }
 assert.deepEqual(records.map(r=>r.quantity),[1,2,1]);
 assert.equal(countryItemPotential(records,0),4);
 assert.equal(resourceNetworkAllocation({development:4,capacity:4,used}).allocated,0);
 assert.throws(()=>resourceNetworkAllocation({development:1,capacity:4,used:2}),/Invalid/);
});
