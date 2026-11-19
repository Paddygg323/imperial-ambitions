import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {smoothOriginalCorners} from '../map-zone-smoothing.mjs';
const read=f=>JSON.parse(readFileSync(new URL(`../../outputs/${f}`,import.meta.url)));
const audit=read('Native-map-full-smoothing.json'),inputs=read('Native-map-zone-translation.json');
test('full smoothing matches48 original executions across all6480 tiles and RNG',()=>{
 assert.equal(audit.cases.length,48);
 for(const [i,c] of audit.cases.entries()){
  const input=inputs.cases[c.inputIndex],state={tiles:structuredClone(input.result.tiles),randomState:c.seed};
  smoothOriginalCorners(state,input.owners,c.noWrap,c.beforeGridByte);
  assert.equal(state.randomState,c.result.randomState,`rng ${i}`);
  assert.deepEqual(state.tiles,c.result.tiles,`tiles ${i}`);
 }
});
