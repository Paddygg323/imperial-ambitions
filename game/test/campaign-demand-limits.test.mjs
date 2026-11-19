import test from 'node:test';import assert from 'node:assert/strict';
import {createGame} from '../engine.mjs';
import {campaignDemandCapacity} from '../campaign-demand-capacity.mjs';
import {campaignDemandLimits} from '../campaign-demand-limits.mjs';
import {homeCargo} from '../economy.mjs';
test('campaign demand limits use merchant cargo and preserve the prepared city query',()=>{
 const s=createGame(),forecast=campaignDemandCapacity(s,'england',{seed:123});
 const before=JSON.stringify(s),result=campaignDemandLimits(s,'england',forecast);
 assert.equal(result.input.countryLimit,homeCargo(s,'england'));assert.equal(result.limits[2],result.input.countryLimit);
 assert.deepEqual(result.input.records.map(r=>r.goods),forecast.transport.networks.map(r=>r.quantities));
 assert.equal(JSON.stringify(s),before);
 s.ships=s.ships.filter(ship=>ship.owner!=='england');
 assert.equal(campaignDemandLimits(s,'england',forecast).limits[2],0);
 assert.throws(()=>campaignDemandLimits(s,'england'),/Prepared/);
});
