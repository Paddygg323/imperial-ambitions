import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {chooseOriginalTownNeighbors} from '../map-town-neighbors.mjs';
test('town neighbor selection matches128 complete native executions',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../outputs/Native-map-town-neighbors.json',import.meta.url)));
 for(const c of fixture.cases){
  const tiles=new Uint8Array(6480*40),tv=new DataView(tiles.buffer),provinces=new Uint8Array(152*212);
  for(let i=0;i<6480;i++){tiles[i*40]=(i+c.n)%8;tv.setInt16(i*40+22,c.n%2===0||(i+c.n)%3?c.province:(c.province+1)%12,true);}
  tiles[c.neighbor*40]=0;tv.setInt16(c.neighbor*40+22,c.province,true);
  provinces.set(Buffer.from(c.initial,'hex'),c.province*212);
  chooseOriginalTownNeighbors(tiles,provinces,c.province,c.noWrap);
  assert.equal(Buffer.from(provinces.slice(c.province*212,(c.province+1)*212)).toString('hex'),c.result,`case${c.n}`);
 }
});
