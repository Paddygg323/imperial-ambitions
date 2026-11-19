import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {indexOriginalProvinceTiles} from '../map-province-tiles.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-province-tiles.json',import.meta.url)));
test('province tile lists match16 native map scans including32-tile provinces',()=>{
 for(const c of audit.cases){
  const tiles=new Uint8Array(6480*40),v=new DataView(tiles.buffer),provinces=new Uint8Array(152*212).fill(255);
  for(let i=0;i<6480;i++){tiles[i*40]=5;v.setInt16(i*40+22,-1,true);}
  for(let p=0;p<152;p++)provinces[p*212+4]=0;
  for(const [i,p] of c.land){tiles[i*40]=0;v.setInt16(i*40+22,p,true);}
  indexOriginalProvinceTiles(tiles,provinces);
  assert.equal(createHash('sha256').update(provinces).digest('hex'),c.sha256);
 }
});
