import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {supplyResourcePriorities} from '../resource-priority-supply.mjs';
test('supply/worker priority stages match875 original executions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-priority-supply-audit.json',import.meta.url)));assert.equal(audit.cases.length,875);
 for(const c of audit.cases)assert.deepEqual(supplyResourcePriorities(c),c.result,JSON.stringify(c));
});

test('native city history is consumed goods, proved by matching warehouse deductions',()=>{
 const a=JSON.parse(readFileSync(new URL('../../outputs/Native-consumption-history-audit.json',import.meta.url)));
 assert.deepEqual(a.reset,Array(28).fill(0));assert.equal(a.production.length,84);assert.equal(a.food.length,3);
 for(const c of a.production)for(let g=0;g<28;g++){
  const amount=g===c.good?c.amount:0;
  assert.equal(c.stock[g],c.beforeStock[g]-amount);assert.equal(c.consumed[g],c.beforeConsumed[g]+amount);
 }
 for(const c of a.food)for(let g=0;g<28;g++){
  assert.equal(c.stock[g],c.beforeStock[g]-c.amounts[g]);assert.equal(c.consumed[g],c.beforeConsumed[g]+c.amounts[g]);
 }
});
test('consumption above transport potential increases food priority; deliveries are not accepted as history',()=>{
 const c={weights:Array(28).fill(1),potential:Array(28).fill(4),demand:Array(28).fill(0),consumed:Array(28).fill(0),stock:Array(28).fill(0),reserved:Array(28).fill(0),workers:[0,0,0,0],additionalPopulation:0};
 assert.equal(supplyResourcePriorities(c)[20],1);
 c.consumed[20]=6;assert.equal(supplyResourcePriorities(c)[20],Math.fround(1+2*Math.fround(.4)));
 const {consumed,...wrong}=c;assert.throws(()=>supplyResourcePriorities({...wrong,delivered:consumed}),/inputs/);
});
