import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {clearOriginalTownTerrain} from '../map-clear-terrain.mjs';
test('town terrain clearing matches whole native execution and preserves unrelated tiles',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../outputs/Native-map-clear-terrain.json',import.meta.url)));
 for(const c of fixture.cases){
  const tiles=Uint8Array.from({length:6480*40},(_,i)=>(i*37+c.n*19)&255),p=c.tile*40;
  tiles[p]=c.n%8;tiles[p+21]=c.picture;tiles[p+28]=c.flags;
  clearOriginalTownTerrain(tiles,c.tile,c.noWrap);
  assert.equal(createHash('sha256').update(tiles).digest('hex'),c.sha256,`case${c.n}`);
 }
});
