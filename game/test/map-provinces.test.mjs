import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {provinceFixture} from './fixtures/province-fixtures.mjs';
import {generateOriginalProvinces} from '../map-provinces.mjs';
import {generateHistoricalMapAttempt} from '../map-historical-attempt.mjs';
import {historicalGenerationRecords} from '../map-historical-records.mjs';
test('complete province generation matches native tile/province bytes and RNG',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../outputs/Native-map-provinces.json',import.meta.url))),hash=b=>createHash('sha256').update(b).digest('hex');
 for(const c of fixture.cases){const s=provinceFixture(c.n);generateOriginalProvinces(s,c.noWrap);assert.equal(hash(s.tiles),c.tilesHash,`tiles${c.n}`);assert.equal(hash(s.provinces),c.provincesHash,`provinces${c.n}`);assert.equal(s.randomState,c.randomState);}
});
test('generated inputs match native province pass or reject its invalid-neighbor write',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../outputs/Generated-province-native-diagnostic.json',import.meta.url))),hash=b=>createHash('sha256').update(b).digest('hex');
 for(const c of fixture.results){
  const state=generateHistoricalMapAttempt(c.seed,historicalGenerationRecords());assert.ok(state.accepted);
  if(!c.complete){assert.equal(c.instruction,'0x54ccba');assert.throws(()=>generateOriginalProvinces(state),/no eligible town neighbor/);continue;}
  generateOriginalProvinces(state);assert.equal(hash(state.tiles),c.tilesHash);assert.equal(hash(state.provinces),c.provincesHash);assert.equal(state.randomState,c.randomState);
 }
});
