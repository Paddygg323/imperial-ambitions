import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {mergeOriginalSeaZones} from '../map-sea-merge.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-sea-merge.json',import.meta.url)));
test('sea-region merging matches32 native full tile/segment mutations',()=>{
 assert.equal(audit.cases.length,32);
 for(const c of audit.cases){
  const tiles=new Uint8Array(6480*40);for(let i=0;i<6480;i++){tiles[i*40]=5;tiles[i*40+4]=22;}
  for(let region=1;region<8;region++)for(let i=region*600;i<region*600+[0,1,6,7,31,32,40][(region+c.n)%7];i++)tiles[i*40+4]=region+22;
  const segments=c.records.map(hex=>Buffer.from(hex,'hex')),state={tiles,seaCount:c.seaCount};
  mergeOriginalSeaZones(state,segments,c.noWrap);
  assert.equal(state.seaCount,c.resultCount,`count ${c.n}`);
  assert.equal(createHash('sha256').update(tiles).digest('hex'),c.tileSha256,`tiles ${c.n}`);
  assert.deepEqual(segments.map(s=>s.toString('hex')),c.segments,`segments ${c.n}`);
 }
});
