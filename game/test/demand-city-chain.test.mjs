import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cityNeeds} from '../city-needs.mjs';
import {cityDemandForecast} from '../demand-forecast.mjs';
test('city to full demand chain matches200 original executions without a needs stub',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-demand-city-chain-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,200);
 for(const c of audit.cases){
  const snapshot=JSON.stringify(c);
  assert.deepEqual(cityNeeds(c.cityInputs),c.needs);
  assert.deepEqual(cityDemandForecast(c),c.result);
  assert.equal(JSON.stringify(c),snapshot);
 }
});
