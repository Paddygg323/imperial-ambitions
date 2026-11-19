import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {startingDevelopment,developCapitalStart} from '../starting-development.mjs';
import {developmentTechnology} from '../development-technology.mjs';
import {NATIVE_GOODS} from '../resource-categories.mjs';
import {createGame} from '../engine.mjs';import {worldIndex,nearby} from '../world.mjs';
test('starting development matches160 original executions including real setter and discovery',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-starting-development-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,160);for(const c of audit.cases)assert.deepEqual(startingDevelopment(c),c.result);
});
test('capital start includes center, reveals mines and crosses domestic province boundaries but excludes foreign land and exotic resources',()=>{
 const home={id:'10,10',x:10,y:10,owner:'england',province:'home',resource:'iron',level:0,prospected:false};
 const tiles=[home,{id:'9,10',x:9,y:10,owner:'england',province:'other',resource:'copper',level:0,prospected:false},{id:'11,10',x:11,y:10,owner:'france',province:'foreign',resource:'grain',level:0,prospected:true},{id:'10,9',x:10,y:9,owner:'england',province:'home',resource:'coal',level:0,prospected:false}];
 const n={known:['8','11']},levels=developmentTechnology(n);developCapitalStart(n,home,new Map(tiles.map(t=>[t.id,t])));
 assert.equal(home.level,levels[4]);assert.equal(home.prospected,true);assert.equal(tiles[1].level,levels[3]);assert.equal(tiles[1].prospected,true);assert.equal(tiles[2].level,0);assert.equal(tiles[3].level,0);
});
test('new historical campaigns apply current agriculture technology at every capital',()=>{
 for(const agricultureDifficulty of [0,2,4]){
 const s=createGame({agricultureDifficulty}),ix=worldIndex(s);
 for(const n of Object.values(s.nations)){
  const home=ix.get(n.capital),levels=developmentTechnology(n);
  for(const t of [home,...nearby(home,ix)]){
   const good=NATIVE_GOODS.indexOf(t.resource);
   if(t.owner===home.owner&&[0,1,2,3,4,10,20,22].includes(good))assert.equal(t.level,levels[good],`${n.id}:${t.id}`);
  }
 }
 }
});
