import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {finishResourceWeights} from '../resource-weight-finish.mjs';
test('resource weight finishing matches240 original food balance/floor/substitute/history cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-weight-finish-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,240);
 for(const c of audit.cases)assert.deepEqual(finishResourceWeights(c),c.result,JSON.stringify(c));
});
