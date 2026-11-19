import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {planningDistanceMaps} from '../planning-distance.mjs';
const audit=JSON.parse(fs.readFileSync(new URL('../../outputs/Native-planning-distance-audit.json',import.meta.url)));
test('road and port distance maps match24 full original executions',()=>{
 assert.equal(audit.cases.length,24);
 for(const c of audit.cases)assert.deepEqual(planningDistanceMaps(c.nodes),{road:c.road,port:c.port});
});
test('fifteen ordered sweeps preserve original directional reach limit',()=>{
 const forward=planningDistanceMaps(audit.cases[0].nodes),reverse=planningDistanceMaps(audit.cases[1].nodes);
 assert.equal(forward.road[31],32);assert.equal(reverse.road[16],16);assert.equal(reverse.road[15],0);
});
