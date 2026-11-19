import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {smoothOriginalZoneBoundary} from '../map-zone-smoothing.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-boundary-smoothing.json',import.meta.url)));
test('boundary smoothing matches240 original executions and RNG',()=>{
 assert.equal(audit.cases.length,240);
 for(const [i,c] of audit.cases.entries()){
  const state={tiles:Array.from({length:6480},(_,i)=>[i]),randomState:c.seed};
  smoothOriginalZoneBoundary(state,c.index,c.self,c.east,c.southWest,c.southEast);
  assert.equal(state.randomState,c.randomState,`rng ${i}`);
  assert.deepEqual(state.tiles.flatMap((v,i)=>v[0]===i?[]:[[i,v[0]]]),c.changes,`copies ${i}`);
 }
});
