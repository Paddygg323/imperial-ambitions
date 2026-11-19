import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {originalSeaPointPosition,originalSeaPoint} from '../map-seapoints.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-seapoints.json',import.meta.url)));
test('all12960 sea-boundary point positions match original executable',()=>{
 const bytes=Buffer.alloc(12960*4);let offset=0;
 for(let tile=0;tile<6480;tile++)for(const upper of [false,true]){bytes.writeUInt32LE(originalSeaPointPosition(tile,upper),offset);offset+=4;}
 assert.equal(audit.encodedCount,12960);assert.equal(createHash('sha256').update(bytes).digest('hex'),audit.sha256);
});
test('sea-boundary records preserve kind and order sea IDs as original',()=>{
 assert.equal(audit.constructors.length,100);
 for(const c of audit.constructors){
  assert.deepEqual(originalSeaPoint(c.position,c.a,c.b,c.kind),c.result);
 }
});
