import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {preferredExternalResources} from '../forecast-external-resources.mjs';
test('preferred external resource forecast matches complete native preference and tile chain',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-preferred-external-resources-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,168);
 assert.ok(audit.cases.some(c=>c.result>0));assert.ok(audit.cases.some(c=>c.result===0));
 for(const c of audit.cases)assert.equal(preferredExternalResources(c),c.result,JSON.stringify(c));
});
