import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {resourceReserve} from '../resource-reserve.mjs';
test('resource reserve targets and technology gates match840 original cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-reserve-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,840);
 for(const c of audit.cases)assert.deepEqual(resourceReserve(c),c.result,JSON.stringify(c));
});
