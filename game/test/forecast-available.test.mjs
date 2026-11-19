import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {forecastAvailable} from '../forecast-available.mjs';
test('forecast available goods match420 original cases, retaining negative values',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-forecast-available-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,420);
 for(const c of audit.cases)assert.equal(forecastAvailable(c),c.result,JSON.stringify(c));
});
