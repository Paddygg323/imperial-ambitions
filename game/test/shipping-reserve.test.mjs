import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {shippingReserve} from '../shipping-reserve.mjs';
test('shipping reserve matches original GDP scaling throughout its transition and signed boundaries',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-shipping-reserve-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,105);
 for(const c of audit.cases)assert.equal(shippingReserve(c.gdp),c.result,'GDP '+c.gdp);
 for(const invalid of [undefined,NaN,Infinity,1.5,2147483648,-2147483649])assert.throws(()=>shippingReserve(invalid));
});
