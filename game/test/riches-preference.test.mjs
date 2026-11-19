import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {richesPreference,campaignRichesPreference} from '../riches-preference.mjs';
test('riches preference matches240 actual getter chains with cash, credit and reservations',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-riches-preference-audit.json',import.meta.url)));assert.equal(audit.cases.length,240);
 for(const c of audit.cases)assert.equal(richesPreference(c),c.result,JSON.stringify(c));
});
test('campaign credit reduces the pressure to acquire riches even at equal treasury',()=>{
 assert.ok(campaignRichesPreference({cash:0,finance:{credit:500000}})<campaignRichesPreference({cash:0,finance:{credit:0}}));
 assert.equal(campaignRichesPreference({cash:88000}),Math.fround(.8));
});
