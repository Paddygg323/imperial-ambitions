import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import names from '../data/overseas-names.mjs';import {originalOverseasNames} from '../map-province-names.mjs';
import {createGame,saveGame,loadGame} from '../engine.mjs';
test('original country counters and resource mapping select the extracted names',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-province-names-audit.json',import.meta.url)));
 const strings=JSON.parse(readFileSync(new URL('./fixtures/strings.json',import.meta.url)));
 assert.equal(audit.cases.length,396);
 for(const mode of [0,1]){
  const counters=Array(22).fill(0);
  for(const c of audit.cases.filter(c=>c.mode===mode)){
   assert.equal(c.group,0xe04+c.country);
   assert.equal(c.index,++counters[c.country]-(mode===1&&c.country<12?1:0));
   assert.equal(c.resource,40832+64*c.country+c.index);
   if(c.country>=12)assert.equal(names[c.country][c.index-1],strings[c.resource]);
  }
 }
});
test('overseas names use record order per owner, skip empty records and do not mutate data',()=>{
 const provinces=new Uint8Array(152*212),pv=new DataView(provinces.buffer);
 for(let i=0;i<152;i++)pv.setInt16(i*212+124,-1,true);
 for(const [id,owner] of [[1,12],[4,13],[5,12],[8,13]]){provinces[id*212]=owner;pv.setInt16(id*212+124,10,true);}
 const before=provinces.slice(),result=originalOverseasNames({provinces});
 assert.deepEqual([...result],[[1,'Tenochitlan'],[4,'Cuzco'],[5,'Texcoco'],[8,'Pachacamac']]);assert.deepEqual(provinces,before);
});
test('new campaigns have verified overseas names and reload preserves existing names',()=>{
 for(const seed of [1500,1501,2026]){
  const s=createGame({seed});const overseas=s.provinces.filter(p=>!p.old);
  assert.ok(overseas.length>0);assert.ok(overseas.every(p=>p.nameVerified&&!/\d/.test(p.name)));
  overseas[0].name='Existing saved province';
  assert.equal(loadGame(saveGame(s)).provinces.find(p=>p.id===overseas[0].id).name,'Existing saved province');
 }
});
