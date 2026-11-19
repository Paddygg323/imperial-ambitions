import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {orderedTransportNetworks} from '../network-order.mjs';
import {resourceNetworkAllocation} from '../resource-network-allocation.mjs';
test('network order matches306 executions of native list ordering and allocation',()=>{
 const data=JSON.parse(readFileSync(new URL('../../outputs/Native-network-order-audit.json',import.meta.url)));
 assert.equal(data.cases.length,306);
 for(const c of data.cases)assert.deepEqual(orderedTransportNetworks(c.rows,c.home),c.order,JSON.stringify(c));
});
test('capital gets first claim on shared production and duplicate capital records get no second claim',()=>{
 const rows=[{root:1,flag:1,capacity:4},{root:3,flag:0,capacity:1},{root:3,flag:1,capacity:4},{root:2,flag:0,capacity:2}];
 const order=orderedTransportNetworks(rows,3);assert.deepEqual(order,[1,3,0]);
 const quantities=Array(4).fill(0);let used=0;
 for(const i of order){const result=resourceNetworkAllocation({development:4,capacity:rows[i].capacity,used});quantities[i]=result.allocated;used=result.usedAfter;}
 assert.deepEqual(quantities,[1,1,0,2]);assert.equal(used,4);
 assert.equal(rows[0].capacity,4,'ordering does not mutate supplied records');
});
