import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {describeOriginalProvince} from '../map-province-neighbors.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-province-neighbors.json',import.meta.url)));
test('province neighbors, resource counts and interior candidates match48 native executions',()=>{
 assert.equal(audit.cases.length,48);
 for(const c of audit.cases){
  const tiles=new Uint8Array(6480*40),v=new DataView(tiles.buffer),provinces=new Uint8Array(152*212);
  for(let i=0;i<6480;i++){tiles[i*40]=5;tiles[i*40+20]=255;v.setInt16(i*40+22,-1,true);}
  for(const [i,p,r] of c.land){tiles[i*40]=0;tiles[i*40+4]=p+12;tiles[i*40+20]=r;v.setInt16(i*40+22,p,true);}
  provinces.set(Buffer.from(c.initial,'hex'));
  assert.deepEqual(describeOriginalProvince(tiles,provinces,0,c.noWrap),c.interior,`interior ${c.n}`);
  assert.equal(Buffer.from(provinces.subarray(0,212)).toString('hex'),c.result,`record ${c.n}`);
 }
});
