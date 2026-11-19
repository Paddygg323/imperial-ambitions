import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {driftOriginalContinents} from '../map-continent-drift.mjs';
const read=f=>JSON.parse(readFileSync(new URL(`../../outputs/${f}`,import.meta.url)));
const audit=read('Native-map-continent-drift.json'),inputs=read('Native-map-full-smoothing.json');
function encode(tiles){
 const raw=new Uint8Array(6480*40),view=new DataView(raw.buffer);
 tiles.forEach(([terrain,nation,province],i)=>{const p=i*40;raw[p]=terrain;raw[p+4]=nation;view.setInt16(p+22,province,true);for(const off of [13,20,21,24,28,29,35])raw[p+off]=(i+off)%251;});return raw;
}
test('continent drift and selective historical overlay match48 whole native executions',()=>{
 assert.equal(audit.cases.length,48);
 for(const [i,c] of audit.cases.entries()){
  const raw=encode(inputs.cases[c.inputIndex].result.tiles),overlay=encode(inputs.cases[(c.inputIndex+1)%12].result.tiles);
  for(let p=0;p<overlay.length;p+=40)if(overlay[p+4]>=12){overlay[p]=5;overlay[p+4]=255;}
  assert.equal(driftOriginalContinents(raw,c.historical?overlay:null,c.noWrap),c.accepted,`return ${i}`);
  assert.equal(createHash('sha256').update(raw).digest('hex'),c.sha256,`all record bytes ${i}`);
 }
});
