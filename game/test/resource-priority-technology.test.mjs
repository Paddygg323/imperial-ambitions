import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {technologyResourceTarget} from '../resource-priority-technology.mjs';
test('technology stock targets match6048 native executions including nine/ten-turn boundary',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-priority-technology-audit.json',import.meta.url)));assert.equal(audit.cases.length,6048);
 for(const c of audit.cases)assert.deepEqual(technologyResourceTarget(c),c.result,JSON.stringify(c));
});
test('luxury planning requires both production and worker access or near-term research',()=>{
 const c={good:7,resourceLevel:0,manufacturingLevel:0,workerLevel:0,manufacturingEta:9,workerEta:10};
 assert.equal(technologyResourceTarget(c).base,-1);
 c.workerEta=9;assert.deepEqual(technologyResourceTarget(c),{base:4,luxuryReady:true});
 c.good=17;assert.deepEqual(technologyResourceTarget(c),{base:2,luxuryReady:true});
});
