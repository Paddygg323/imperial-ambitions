import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {seekOpenTile,startingCivilianTiles} from '../starting-civilians.mjs';import {createGame} from '../engine.mjs';
test('open tile search matches180 original executions with real radial helpers and no stubs',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-open-tile-audit.json',import.meta.url)));assert.equal(audit.cases.length,180);
 for(const c of audit.cases)assert.equal(seekOpenTile(c),c.result,JSON.stringify({start:c.start,allow:c.allowPort,wrap:c.noWrap}));
});
test('standard initial civilian sequence matches original placement section',()=>{
 const cases=JSON.parse(readFileSync(new URL('../../outputs/Native-starting-civilians-audit.json',import.meta.url))).cases;
 for(const c of cases.filter(c=>c.menuMode===0)){
  const tiles={};for(let y=28;y<33;y++)for(let x=48;x<53;x++)tiles[y*108+x]={terrain:0,owner:2,port:y*108+x===c.capital,occupants:[]};
  for(const u of c.civilians){const tile=seekOpenTile({start:c.capital,allowPort:u.nativeType===1,tiles});assert.equal(tile,u.tile);tiles[tile].occupants.push(2);}
 }
});
test('historical civilian placement stays in own land with distinct units and engineer at capital',()=>{
 const s=createGame(),before=JSON.stringify(s);
 for(const id of Object.keys(s.nations)){
  const places=startingCivilianTiles(s,id);assert.deepEqual(s.civilians.filter(c=>c.owner===id).map(({type,tile})=>({type,tile})),places);assert.equal(new Set(places.map(p=>p.tile)).size,3);
  assert.equal(places.find(p=>p.type==='engineer').tile,s.nations[id].capital);
  for(const p of places)assert.equal(s.tiles.find(t=>t.id===p.tile).owner,id);
 }
 assert.equal(JSON.stringify(s),before);
});
