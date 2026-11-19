import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stockResourceWeight,flowResourceWeight,consumptionResourceWeight} from '../resource-shortage.mjs';
test('stock, production-flow and consumption priority stages match600 original cases each',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-resource-shortage-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,600);
 for(const c of audit.cases)assert.deepEqual({stock:stockResourceWeight(c),flow:flowResourceWeight(c),consumption:consumptionResourceWeight(c)},c.result,JSON.stringify(c));
});
