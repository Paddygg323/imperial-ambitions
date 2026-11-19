import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resourcePlanningTotals} from '../resource-planning-totals.mjs';
test('complete resource planning lists match170 original reset/iteration/accumulation cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-planning-totals-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,170);
 for(const c of audit.cases)assert.deepEqual(resourcePlanningTotals(c.rows),c.result,JSON.stringify(c.rows));
});
