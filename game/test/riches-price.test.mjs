import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {richesDealPrice} from '../riches-price.mjs';
test('riches deal prices match630 original relationship and commodity cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-riches-price-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,630);
 for(const c of audit.cases)assert.equal(richesDealPrice(c.base,c.relation),c.charge,JSON.stringify(c));
 assert.equal(richesDealPrice(400,255),1,'maximum relationship does not guarantee zero price');
 assert.equal(richesDealPrice(400,0),401,'zero relation uses256 rather than255');
});
