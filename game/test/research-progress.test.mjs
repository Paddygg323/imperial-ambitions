import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {researchProgress} from '../research-progress.mjs';
test('research progress and strict completion threshold match424 original executions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-research-progress-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,424);
 for(const c of audit.cases)assert.deepEqual(researchProgress(c),c.result,JSON.stringify(c));
 assert.equal(researchProgress({progress:.5,gain:0,roll:32767}).complete,false);
});
