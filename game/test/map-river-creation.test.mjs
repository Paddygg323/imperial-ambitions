import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {createOriginalRivers} from '../map-river-growth.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-river-creation.json',import.meta.url)));
test('river creation matches16 whole native passes',()=>{
 assert.equal(audit.cases.length,16);
 for(const [n,c] of audit.cases.entries()){
  const tiles=new Uint8Array(6480*40),view=new DataView(tiles.buffer);
  for(let i=0;i<6480;i++){
   const x=i%108,y=Math.trunc(i/108),p=i*40,land=x>=30&&x<=60&&y>=15&&y<=40;
   tiles[p]=land?0:5;tiles[p+4]=land?12:255;
   if(land&&x>=42&&x<=48&&y>=25&&y<=31)tiles[p]=3;
   if(land&&c.pattern===1&&i%17===0)tiles[p]=2;
   if(land&&c.pattern===2&&i%29===0)tiles[p]=3;
   if(land&&c.pattern===3&&i%31===0)tiles[p+2]=2;
   view.setInt16(p+22,land?(c.pattern===4?Math.trunc(x/4):0):-1,true);
  }
  const state={tiles,randomState:c.seed};
  createOriginalRivers(state,{firstNation:12,lastNation:21,rivers:c.rivers},c.noWrap);
  assert.equal(state.randomState,c.randomState,`rng ${n}`);
  assert.equal(createHash('sha256').update(tiles).digest('hex'),c.sha256,`bytes ${n}`);
 }
});
