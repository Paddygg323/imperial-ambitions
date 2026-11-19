import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {resetOriginalMapTiles} from '../map-tile-reset.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-tile-reset.json',import.meta.url)));
test('tile reset matches native defaults and preserves untouched bytes on dirty buffers',()=>{
 assert.equal(audit.cases.length,4);
 for(const c of audit.cases){
  const tiles=Uint8Array.from({length:6480*40},(_,i)=>(i*c.seed+c.seed)&255);
  resetOriginalMapTiles(tiles);
  assert.equal(createHash('sha256').update(tiles).digest('hex'),c.sha256);
 }
});
