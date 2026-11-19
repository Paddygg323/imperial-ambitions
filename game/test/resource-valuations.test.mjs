import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {resourceValuations} from '../resource-valuations.mjs';
test('item valuations match240 complete native executions and preserve unmodified fields',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-valuations-audit.json',import.meta.url)));
 assert.equal(audit.foodPrice,150);assert.equal(audit.cases.length,240);
 for(const c of audit.cases){assert.deepEqual(resourceValuations(c),c.result);assert.deepEqual(c.result.slice(23),c.initial.slice(23));}
});
