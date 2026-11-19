import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {finalizeResourcePriorities} from '../resource-priority-finalization.mjs';
test('resource priority final stage matches432 native executions including turn1/50 boundaries',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-priority-finalization-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,432);
 for(const c of audit.cases)assert.deepEqual(finalizeResourcePriorities(c),c.result,JSON.stringify(c));
});
test('resource priority finalization does not mutate its supplied input arrays',()=>{
 const input={weights:Array(28).fill(2),previous:Array(28).fill(1),potential:Array(28).fill(0),turn:2,steel:true};
 const before=structuredClone(input);finalizeResourcePriorities(input);assert.deepEqual(input,before);
 assert.throws(()=>finalizeResourcePriorities({...input,weights:[]}),/inputs/);
});
