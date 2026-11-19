import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {initialDemand} from '../demand-initial.mjs';
test('initial military and civilian forecast matches400 original executions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-demand-initial-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,400);
 for(const c of audit.cases)assert.deepEqual(initialDemand(c),c.result,JSON.stringify(c));
});
