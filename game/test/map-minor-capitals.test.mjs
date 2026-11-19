import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {capitalWorld} from './fixtures/minor-capital-world-fixtures.mjs';
import {selectOriginalMinorCapital,establishOriginalMinorCapital} from '../map-minor-capitals.mjs';
import {convertOriginalMapToGameplay} from '../map-gameplay-conversion.mjs';
import {riverRouteResult} from '../river-routes.mjs';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {portSeas} from '../overseas.mjs';
test('minor capital selection and establishment match original on generated worlds',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../outputs/Native-minor-capital-worlds.json',import.meta.url))),hash=b=>createHash('sha256').update(b).digest('hex');
 for(const c of fixture.cases){const s=capitalWorld(c.seed),game=convertOriginalMapToGameplay(s),ix=new Map(game.tiles.map(t=>[t.id,t]));
  const tile=selectOriginalMinorCapital(s,c.owner,{riverBlocked:i=>riverRouteResult(game,ix.get(`${i%108},${Math.floor(i/108)}`),ix)!==0});
  assert.equal(tile,c.selected,`capital ${c.seed}/${c.owner}`);establishOriginalMinorCapital(s,tile);
  assert.equal(hash(s.tiles),c.tilesHash,`tiles ${c.seed}/${c.owner}`);assert.equal(hash(s.provinces),c.provincesHash,`provinces ${c.seed}/${c.owner}`);
 }
});
test('generated minor capitals have sea access and persist without regeneration',()=>{
 for(const seed of [1500,1501,1502,1503,1504,1505]){
  const s=createGame({seed});
  for(const minor of Object.values(s.minors)){
   assert.ok(portSeas(s,minor.capital).length,`${seed}/${minor.id} must reach sea`);
   const tile=s.tiles.find(t=>t.id===minor.capital),province=s.provinces.find(p=>p.id===tile.province);
   assert.equal(province.town,minor.capital);assert.equal(tile.terrain,13);assert.equal(tile.port,true);
   assert.equal(s.tiles.filter(t=>t.province===province.id&&t.terrain===13).length,1);
  }
  const loaded=loadGame(saveGame(s));assert.deepEqual(loaded.minors,s.minors);assert.deepEqual(loaded.tiles,s.tiles);
 }
});
