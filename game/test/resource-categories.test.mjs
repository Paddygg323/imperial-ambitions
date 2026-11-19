import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resourceCategories,NATIVE_GOODS} from '../resource-categories.mjs';
test('resource classifications and substitutes match all original IDs and outer boundaries',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-categories-audit.json',import.meta.url)));
 assert.equal(NATIVE_GOODS.length,28);assert.equal(audit.cases.length,30);
 for(const {good,...expected} of audit.cases)assert.deepEqual(resourceCategories(good),expected,String(good));
});
