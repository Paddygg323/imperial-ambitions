import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {assignOriginalTileResource,assignOriginalMapResources} from '../map-resources.mjs';
import {createHash} from 'node:crypto';
import {generateHistoricalMapAttempt} from '../map-historical-attempt.mjs';
import {historicalGenerationRecords} from '../map-historical-records.mjs';
import {generateOriginalProvinces} from '../map-provinces.mjs';
test('tile resource assignment and picture match1600 whole native executions',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../outputs/Native-map-resources.json',import.meta.url)));
 for(const c of fixture.cases){
  const tiles=new Uint8Array(6480*40);for(let i=0;i<6480;i++)tiles[i*40]=c.n%3===0?0:5;
  tiles.set(Buffer.from(c.initial,'hex'),c.tile*40);const state={tiles,randomState:c.seed};
  assignOriginalTileResource(state,c.tile,{noWrap:!!(c.n%2),resourceOption:Math.floor(c.n/8)%2});
  assert.equal(Buffer.from(tiles.slice(c.tile*40,c.tile*40+40)).toString('hex'),c.result,`case${c.n}`);assert.equal(state.randomState,c.randomState,`RNG${c.n}`);
 }
});
test('whole historical resource pass and ensuing province pass match native execution',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../outputs/Generated-resource-province-native-diagnostic.json',import.meta.url))),hash=b=>createHash('sha256').update(b).digest('hex');
 for(const c of fixture.results){
  const s=generateHistoricalMapAttempt(c.seed,historicalGenerationRecords());assert.ok(s.accepted);
  const before=s.tiles.slice();assignOriginalMapResources(s);
  assert.equal(hash(s.tiles),c.resourceTilesHash,`resources${c.seed}`);assert.equal(s.randomState,c.resourceRandomState);
  for(let i=0;i<6480;i++)if(s.tiles[i*40+4]<12){assert.equal(s.tiles[i*40+20],before[i*40+20]);assert.equal(s.tiles[i*40+21],before[i*40+21]);}
  if(!c.complete){assert.throws(()=>generateOriginalProvinces(s),/no eligible town neighbor/);continue;}
  generateOriginalProvinces(s);assert.equal(hash(s.tiles),c.tilesHash);assert.equal(hash(s.provinces),c.provincesHash);assert.equal(s.randomState,c.randomState);
 }
});
