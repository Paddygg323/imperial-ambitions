import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {growOriginalRiver} from '../map-river-growth.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-river-growth.json',import.meta.url)));
test('river growth matches240 whole native recursive routes, including failed routes',()=>{
 assert.equal(audit.cases.length,240);
 for(const [n,c] of audit.cases.entries()){
  const tiles=new Uint8Array(6480*40),view=new DataView(tiles.buffer);
  for(let i=0;i<6480;i++){
   const x=i%108,y=Math.trunc(i/108),p=i*40,land=x>=30&&x<=60&&y>=15&&y<=40;
   tiles[p]=land?0:5;
   if(land&&c.pattern===1&&i%17===0)tiles[p]=2;
   if(land&&c.pattern===2&&i%29===0)tiles[p]=3;
   if(land&&c.pattern===3&&i%31===0)tiles[p+2]=2;
   view.setInt16(p+22,land?(c.pattern===4?Math.trunc(x/4):0):-1,true);
  }
  const state={tiles,randomState:c.seed};
  assert.equal(growOriginalRiver(state,c.index,c.heading,c.entrance,c.length,c.allowHill,c.noWrap),c.accepted,`return ${n}`);
  assert.equal(state.randomState,c.randomState,`rng ${n}`);
  assert.equal(createHash('sha256').update(tiles).digest('hex'),c.sha256,`bytes ${n}`);
 }
});
