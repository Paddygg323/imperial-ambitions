import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {forecastLabourCapacity} from '../demand-capacity.mjs';
test('forecast capacity matches400 original executions and non-sugar independence',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-demand-capacity-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,400);
 for(const c of audit.cases)assert.equal(forecastLabourCapacity(c),c.result,JSON.stringify(c));
 for(let i=0;i<audit.cases.length;i+=2)assert.equal(audit.cases[i].result,audit.cases[i+1].result);
});
