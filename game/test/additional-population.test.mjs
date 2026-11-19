import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {additionalPopulationEstimate} from '../additional-population.mjs';
test('additional population estimate matches620 native food/stock/trade/population cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-additional-population-audit.json',import.meta.url)));
 assert.equal(audit.fpuControlWord,0x23f);
 assert.equal(audit.cases.length,620);
 for(const c of audit.cases)assert.equal(additionalPopulationEstimate(c),c.result,JSON.stringify(c));
});
