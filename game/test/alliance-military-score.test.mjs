import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {allianceMilitaryScore} from '../alliance-military-score.mjs';
test('military alliance score matches360 original border/nonborder cases including clamps and allied opponents',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-military-score-audit.json',import.meta.url),'utf8'));
 for(const c of audit.cases)assert.equal(allianceMilitaryScore(c),c.result,JSON.stringify(c));
});
