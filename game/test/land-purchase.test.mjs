import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {landPrice} from '../land-price.mjs';
test('merchant land quote matches580 original executions including diplomacy and towns',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-land-price-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,580);for(const c of audit.cases)assert.equal(landPrice(c),c.result,JSON.stringify(c));
});
test('original completed merchant purchase changes economic ownership without annexing province',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-purchase-owner-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,396);assert.equal(audit.branch,'0x4f24f5');
 for(const c of audit.cases){assert.equal(c.result,c.buyer);assert.equal(c.sovereign,c.owner);}
});
