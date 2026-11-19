import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {allianceSeekingThreat,allianceSeekingThreshold} from '../alliance-seeking-threat.mjs';
test('alliance threat trigger matches 432 executed original scans',()=>{
 const {cases}=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-seeking-threat-audit.json',import.meta.url),'utf8'));
 assert.equal(cases.length,432);
 const rating=n=>({border:Math.fround(n),nonborder:Math.fround(n*1.7)});
 for(const c of cases){
  const others=[...(c.present?[c.other]:[]),c.ally].map(n=>({borders:c.border,strength:rating(n)}));
  assert.equal(allianceSeekingThreat({own:rating(c.own),allies:c.ally?[rating(c.ally)]:[],others,threshold:Math.fround(c.threshold)}),c.seek,JSON.stringify(c));
 }
});
test('seeking threshold matches all 35 native minister combinations',()=>{
 const {cases}=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-seeking-personality-audit.json',import.meta.url),'utf8'));
 assert.equal(cases.length,35);
 for(const c of cases)assert.equal(allianceSeekingThreshold(c.minister204,c.minister20c),c.threshold);
});
