import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {finishDemand} from '../demand-finish.mjs';
test('recruitment, manufacturing and labour forecast compose like500 continuous original executions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-demand-finish-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,500);
 for(const c of audit.cases)assert.deepEqual(finishDemand(c),c.result,JSON.stringify(c));
});
