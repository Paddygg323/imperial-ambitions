import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {eligibleCommodityOffer} from '../offer-eligibility.mjs';
test('offer gate matches420 original cargo, bid and commodity combinations',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-offer-eligibility-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,420);
 for(const c of audit.cases)assert.equal(eligibleCommodityOffer(c.good,c.cargo,c.bid),c.eligible);
});
