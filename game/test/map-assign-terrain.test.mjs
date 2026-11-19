import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {assignOriginalTerrain} from '../map-assign-terrain.mjs';
const read=f=>JSON.parse(readFileSync(new URL(`../../outputs/${f}`,import.meta.url)));
const audit=read('Native-map-assign-terrain.json'),inputs=read('Native-map-full-smoothing.json');
test('whole terrain assignment matches16 native executions with mountains, vegetation and rivers',()=>{
 assert.equal(audit.cases.length,16);
 for(const c of audit.cases){
  const tiles=new Uint8Array(6480*40),view=new DataView(tiles.buffer);
  inputs.cases[c.inputIndex].result.tiles.forEach(([t,n,p],i)=>{tiles[i*40]=t;tiles[i*40+4]=n;view.setInt16(i*40+22,p,true);});
  const state={tiles,randomState:c.seed};assignOriginalTerrain(state,c,c.noWrap);
  assert.equal(state.randomState,c.randomState,`rng ${c.inputIndex}`);
  assert.equal(createHash('sha256').update(tiles).digest('hex'),c.sha256,`bytes ${c.inputIndex}`);
 }
});
