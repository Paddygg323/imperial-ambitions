import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {demandLimits} from '../demand-limits.mjs';
test('central resource limits match400 continuous original executions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-demand-limits-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,400);
 for(const c of audit.cases)assert.deepEqual(demandLimits(c),c.result,JSON.stringify(c));
 assert.ok(audit.cases[0].result.limits[0]<0);
});
