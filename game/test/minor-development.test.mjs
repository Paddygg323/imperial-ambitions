import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {minorStartingDevelopment,developMinorStarts} from '../minor-development.mjs';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {nearby,worldIndex} from '../world.mjs';
const goods=['wool','timber','tin','copper','iron','coal','cotton','sugarCane','tobacco','furs','horses','fabric','lumber','paper','bronze','castIron','steel','sugar','cigars','hats','spices','silver','gold','gems','diamonds','grain','meat','fish'];
test('minor adjacent development matches all232 native cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-minor-development-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,232);
 for(const c of audit.cases){
  const value=minorStartingDevelopment(goods[c.resource],{tribal:c.owner>=12,sameOwner:c.sameOwner});
  assert.deepEqual(Array(6).fill(value),c.levels,JSON.stringify(c));
 }
});
test('starting minor development changes only eligible adjacent owned tiles',()=>{
 const s={minors:{minor:{id:'minor',capital:'0,0'}},provinces:[{id:'p',old:true}],tiles:[
  {id:'0,0',x:0,y:0,province:'p',owner:'minor',level:0},
  {id:'1,0',x:1,y:0,owner:'minor',resource:'iron',level:0},
  {id:'-1,0',x:-1,y:0,owner:'other',resource:'timber',level:0},
  {id:'0,1',x:0,y:1,owner:'minor',resource:'grain',level:0},
  {id:'4,0',x:4,y:0,owner:'minor',resource:'copper',level:0}]};
 developMinorStarts(s);assert.deepEqual(s.tiles.map(t=>t.level),[0,1,0,0,0]);
});
test('new campaigns develop minor resources and reload does not regenerate development',()=>{
 const s=createGame(),ix=worldIndex(s);let count=0;
 for(const m of Object.values(s.minors)){
  const home=ix.get(m.capital),p=s.provinces.find(p=>p.id===home.province);
  for(const t of nearby(home,ix))if(minorStartingDevelopment(t.resource,{tribal:!p.old,sameOwner:t.owner===m.id})){assert.equal(t.level,1);count++;}
 }
 assert.ok(count>5);const developed=s.tiles.find(t=>s.minors[t.owner]&&t.level===1);developed.level=0;
 assert.equal(loadGame(saveGame(s)).tiles.find(t=>t.id===developed.id).level,0);
});
