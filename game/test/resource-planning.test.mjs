import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resourcePlanningContribution} from '../resource-planning.mjs';
test('resource planning distinguishes connection, development and feasible unused tiles in44800 native cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-planning-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,44800);
 for(const c of audit.cases)assert.deepEqual(resourcePlanningContribution(c),c.result,JSON.stringify(c));
});
