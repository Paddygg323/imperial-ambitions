import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {originalRiverPicture} from '../map-river-picture.mjs';
test('river picture conversion and RNG match8192 native continuity cases',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../outputs/Native-map-river-picture.json',import.meta.url))),tiles=new Uint8Array(6480*40);
 for(const [tile,terrain,code,left,right,seed,result,randomState] of fixture.cases){
  tiles[tile*40]=terrain;tiles[tile*40+2]=code;tiles[(tile-1)*40+2]=left;tiles[(tile-107)*40+2]=right;
  const s={tiles,randomState:seed};assert.equal(originalRiverPicture(s,tile),result,`${tile}/${terrain}/${code}/${left}/${right}`);assert.equal(s.randomState,randomState);
 }
});
