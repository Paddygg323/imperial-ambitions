import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {seedOriginalMountainRange} from '../map-terrain-growth.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-mountain-growth.json',import.meta.url)));
test('mountain ranges match240 complete original recursive executions',()=>{
 assert.equal(audit.cases.length,240);
 for(const [n,c] of audit.cases.entries()){
  const tiles=new Uint8Array(6480*40);
  for(let i=0;i<6480;i++)tiles[i*40]=c.pattern===1&&[20,60].includes(i%108)?5:c.pattern===2&&i%17===0?2:c.pattern===3&&i%23===0?3:0;
  const state={tiles,randomState:c.seed};
  assert.equal(seedOriginalMountainRange(state,c.index,c.length,c.direction,c.noWrap),c.count,`count ${n}`);
  assert.equal(state.randomState,c.randomState,`rng ${n}`);
  assert.equal(createHash('sha256').update(tiles).digest('hex'),c.sha256,`bytes ${n}`);
 }
});
