import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {renumberOriginalProvinces} from '../map-province-renumber.mjs';
const read=f=>JSON.parse(readFileSync(new URL(`../../outputs/${f}`,import.meta.url)));
const audit=read('Native-map-province-renumber.json'),inputs=read('Native-map-full-smoothing.json');
test('province renumbering and historical town/capital flags match12 whole native passes',()=>{
 assert.equal(audit.cases.length,12);
 const historical=Uint8Array.from(Buffer.from(audit.historicalBase64,'base64'));
 for(const c of audit.cases){
  const tiles=historical.slice(),view=new DataView(tiles.buffer),provinces=new Uint8Array(152*212).fill(165);
  inputs.cases[c.inputIndex].result.tiles.forEach(([terrain,nation,province],i)=>{
   if(nation>=12&&historical[i*40+4]===255){const p=i*40;tiles[p]=terrain;tiles[p+4]=nation;view.setInt16(p+22,province,true);}
  });
  assert.equal(renumberOriginalProvinces(tiles,provinces,historical),c.accepted,`return ${c.inputIndex}`);
  for(const [raw,hash] of [[tiles,c.tilesHash],[provinces,c.provincesHash]])assert.equal(createHash('sha256').update(raw).digest('hex'),hash,`bytes ${c.inputIndex}`);
 }
});
