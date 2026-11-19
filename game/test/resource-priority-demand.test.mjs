import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {demandResourcePriorities} from '../resource-priority-demand.mjs';
test('demand priority stage matches128 native executions including signed substitute overflow',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-priority-demand-audit.json',import.meta.url)));assert.equal(audit.cases.length,128);
 for(const c of audit.cases)assert.deepEqual(demandResourcePriorities(c),c.result,JSON.stringify(c));
});
test('missing transport input is rejected rather than treated as zero supply',()=>{
 assert.throws(()=>demandResourcePriorities({weights:Array(28).fill(1),demand:Array(28).fill(1),luxuryReady:false}),/inputs/);
});
