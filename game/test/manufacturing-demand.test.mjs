import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {manufacturingDemand} from '../manufacturing-demand.mjs';
test('manufacturing demand and supplied-material deductions match328 original cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-manufacturing-demand-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,328);
 for(const c of audit.cases)assert.deepEqual(manufacturingDemand(c),c.result,JSON.stringify(c));
});
