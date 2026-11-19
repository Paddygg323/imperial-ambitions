import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {allianceTerritorialFactor} from '../alliance-territorial-factor.mjs';
test('territorial alliance multiplier matches42 original executions and excludes overseas provinces',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-territorial-factor-audit.json',import.meta.url),'utf8'));
 for(const c of audit.cases)assert.equal(allianceTerritorialFactor(c.old,c.total),c.result,JSON.stringify(c));
});
test('territorial factor validates population and preserves majority boundary',()=>{
 assert.equal(allianceTerritorialFactor(50,100),1);assert.equal(allianceTerritorialFactor(51,100),1.01);
 for(const [old,total] of [[-1,100],[101,100],[1,0],[1.5,100]])assert.throws(()=>allianceTerritorialFactor(old,total),/Invalid/);
});
