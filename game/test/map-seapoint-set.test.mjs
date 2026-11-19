import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {generateOriginalSeaPoints} from '../map-seapoints.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-seapoint-set.json',import.meta.url)));
test('whole boundary-point enumeration matches24 native runs in exact order',()=>{
 assert.equal(audit.cases.length,24);
 for(const c of audit.cases){
  const tiles=new Uint8Array(6480*40),p=c.pattern;
  for(let i=0;i<6480;i++){
   const x=i%108,y=Math.trunc(i/108);
   tiles[i*40]=p===0||(x*7+y*11+p)%17>=p%7?5:0;
   tiles[i*40+4]=(Math.trunc(x/(p+1))+Math.trunc(y/(p+2)))%(p+2)+22;
  }
  const before=tiles.slice(),points=generateOriginalSeaPoints(tiles,c.noWrap);
  assert.deepEqual(tiles,before);
  assert.equal(points.length,c.count,`count ${p}/${c.noWrap}`);
  const packed=Buffer.alloc(points.length*16);points.forEach((point,i)=>point.forEach((v,j)=>packed.writeInt32LE(v,i*16+j*4)));
  assert.equal(createHash('sha256').update(packed).digest('hex'),c.sha256,`ordered records ${p}/${c.noWrap}`);
 }
});
