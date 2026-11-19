import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {forecastExternalResources} from '../forecast-external-resources.mjs';
test('external forecast scan matches280 original executions across all goods',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-forecast-external-resources-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,280);
 for(const c of audit.cases)assert.equal(forecastExternalResources(c),c.result,JSON.stringify(c));
});
