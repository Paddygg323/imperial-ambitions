import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {demandForecast} from '../demand-forecast.mjs';
test('complete forecast matches200 uninterrupted original function executions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-demand-complete-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,200);
 for(const c of audit.cases)assert.deepEqual(demandForecast(c),c.result,JSON.stringify(c));
});
