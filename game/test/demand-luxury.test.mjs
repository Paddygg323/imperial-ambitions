import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {correctLuxuryDemand} from '../demand-luxury.mjs';
test('luxury demand correction matches600 original executions including capped sugar demand',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-demand-luxury-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,600);
 for(const c of audit.cases)assert.deepEqual(correctLuxuryDemand(c),c.result,JSON.stringify(c));
});
