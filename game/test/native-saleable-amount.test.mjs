import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nativeSaleableAmount,nativePriceCheck} from '../native-saleable-amount.mjs';
test('saleable amount matches 1050 executable cases, including 600 native money-want chains',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-saleable-amount-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,1050);assert.equal(audit.chainCases,600);
 for(const c of audit.cases)assert.equal(nativeSaleableAmount(c),c.result,JSON.stringify(c));
});
test('high-price exception matches 720 native executable cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-trade-price-check-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,720);
 for(const c of audit.cases)assert.equal(nativePriceCheck(c),c.result,JSON.stringify(c));
});
