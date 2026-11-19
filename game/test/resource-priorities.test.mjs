import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {resourcePriorities} from '../resource-priorities.mjs';
import {richesPreference} from '../riches-preference.mjs';
test('complete resource priorities match240 original SetItemWeightingValues executions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-priorities-audit.json',import.meta.url)));assert.equal(audit.cases.length,240);
 for(const c of audit.cases){const preference=richesPreference({cash:c.cash,credit:c.credit,reserved:c.reservedCash});assert.equal(preference,c.richesPreference);assert.deepEqual(resourcePriorities({...c,richesPreference:preference}),c.result,JSON.stringify(c));}
});
