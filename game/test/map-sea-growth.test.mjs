import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {growOriginalSeaSet} from '../map-sea-growth.mjs';
import {generateOriginalSeaPoints,matchOriginalSeaPoints,originalSeaSegment} from '../map-seapoints.mjs';
import {mergeOriginalSeaZones} from '../map-sea-merge.mjs';
import {generateOriginalOcean} from '../map-ocean.mjs';
const read=f=>JSON.parse(readFileSync(new URL(`../../outputs/${f}`,import.meta.url)));
const audit=read('Native-map-sea-growth.json'),inputs=read('Native-map-full-smoothing.json');
test('sea region growth matches40 whole native executions including caller defaults',()=>{
 assert.equal(audit.cases.length,40);
 for(const c of audit.cases){
  const tiles=new Uint8Array(6480*40),view=new DataView(tiles.buffer);
  inputs.cases[c.inputIndex].result.tiles.forEach(([t,n,p],i)=>{tiles[i*40]=t;tiles[i*40+4]=n;view.setInt16(i*40+22,p,true);});
  const state={tiles,randomState:c.seed};
  if(c.columns===18&&c.rows===10)growOriginalSeaSet(state,undefined,undefined,c.noWrap);
  else growOriginalSeaSet(state,c.columns,c.rows,c.noWrap);
  assert.equal(state.seaCount,c.seaCount,`count ${c.inputIndex}`);
  assert.equal(state.randomState,c.randomState,`rng ${c.inputIndex}`);
  assert.equal(createHash('sha256').update(tiles).digest('hex'),c.sha256,`bytes ${c.inputIndex}`);
  const points=generateOriginalSeaPoints(tiles,c.noWrap),packed=Buffer.alloc(points.length*16);
  points.forEach((point,i)=>point.forEach((v,j)=>packed.writeInt32LE(v,i*16+j*4)));
  assert.equal(points.length,c.boundaryCount,`boundary count ${c.inputIndex}`);
  assert.equal(createHash('sha256').update(packed).digest('hex'),c.boundarySha256,`boundary order ${c.inputIndex}`);
  const segments=matchOriginalSeaPoints(points).map(([a,b])=>{const s=Buffer.alloc(24);s.set(originalSeaSegment(a,b));return s;});
  assert.equal(segments.length,c.segmentCount);
  assert.equal(createHash('sha256').update(Buffer.concat(segments)).digest('hex'),c.segmentSha256,`segments ${c.inputIndex}`);
  if(c.mergeEligible){
   mergeOriginalSeaZones(state,segments,c.noWrap);
   assert.equal(state.seaCount,c.mergedCount);
   assert.equal(createHash('sha256').update(tiles).digest('hex'),c.mergedTileSha256,`merged tiles ${c.inputIndex}`);
   assert.equal(createHash('sha256').update(Buffer.concat(segments)).digest('hex'),c.mergedSegmentSha256,`merged segments ${c.inputIndex}`);
  }
 }
});
test('ocean orchestration matches19 complete native chains and rejects21 invalid coverages',()=>{
 assert.equal(audit.cases.filter(c=>c.mergeEligible).length,19);
 for(const c of audit.cases){
  const tiles=new Uint8Array(6480*40),view=new DataView(tiles.buffer);
  inputs.cases[c.inputIndex].result.tiles.forEach(([t,n,p],i)=>{tiles[i*40]=t;tiles[i*40+4]=n;view.setInt16(i*40+22,p,true);});
  const state={tiles,randomState:c.seed},result=generateOriginalOcean(state,c);
  assert.equal(result.accepted,c.mergeEligible);
  assert.equal(state.randomState,c.randomState);
  if(result.accepted){
   assert.equal(state.seaCount,c.mergedCount);
   assert.equal(createHash('sha256').update(tiles).digest('hex'),c.mergedTileSha256);
   const packed=Buffer.concat(result.segments.map(s=>{const b=Buffer.alloc(24);b.set(s);return b;}));
   assert.equal(createHash('sha256').update(packed).digest('hex'),c.mergedSegmentSha256);
  }else{
   assert.ok(result.unassigned.length>0);
   assert.equal(createHash('sha256').update(tiles).digest('hex'),c.sha256);
  }
 }
});
