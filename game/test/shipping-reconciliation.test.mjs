import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {reconcileShipping} from '../shipping-reconciliation.mjs';
test('pre-delivery reconciliation matches200 original complete executions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-shipping-reconciliation-audit.json',import.meta.url)));assert.equal(audit.cases.length,200);
 for(const [i,c] of audit.cases.entries()){const before=structuredClone(c);assert.deepEqual(reconcileShipping(c),c.result,'native '+i);assert.deepEqual(c,before);}
});
test('lost safe potential redistributes across danger groups but per-port excess alone does not trigger it',()=>{
 const row=(root,potential,assigned,flag)=>({root,potential,assigned,flag,owner:0,automatic:false});
 assert.deepEqual(reconcileShipping({home:0,records:[row(1,1,5,0),row(2,7,0,1)],usedByOwner:[5]}),{assigned:[1,4],usedByOwner:[5]});
 assert.deepEqual(reconcileShipping({home:0,records:[row(1,1,5,0),row(2,7,0,0)],usedByOwner:[5]}),{assigned:[5,0],usedByOwner:[5]});
});
