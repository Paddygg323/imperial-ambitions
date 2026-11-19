import {allocationPriorityOrder} from '../allocation-priority-order.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createGame} from '../engine.mjs';
import {campaignEconomicForecast} from '../campaign-economic-forecast.mjs';
import {resourceValuations} from '../resource-valuations.mjs';
const options=()=>({planning:{unused:Array(28).fill(0),undeveloped:Array(28).fill(0)},previous:Array(28).fill(1),values:Array(28).fill(17)});
test('economic forecast follows native demand-priority-valuation sequence without issuing orders',()=>{
 const s=createGame({preferenceSeed:123}),before=structuredClone(s),r=campaignEconomicForecast(s,'england',options());
 assert.deepEqual(r.allocationOrder,allocationPriorityOrder(r.priorities));
 assert.equal(r.forecast.demand.length,28);assert.equal(r.priorities.length,28);
 assert.deepEqual(r.valuations,resourceValuations({weights:r.priorities,prices:r.prices,initial:options().values}));
 assert.deepEqual(r.valuations.slice(23),Array(5).fill(17));
 before.nations.england.cityForecast=structuredClone(s.nations.england.cityForecast);assert.deepEqual(s,before);
});
test('missing prior values cannot partially commit forecast state',()=>{
 const s=createGame(),before=JSON.stringify(s),o=options();delete o.values;
 assert.throws(()=>campaignEconomicForecast(s,'england',o),/valuation/);assert.equal(JSON.stringify(s),before);
});
