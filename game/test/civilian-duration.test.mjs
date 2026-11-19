import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transportConstructionTurns,NATIVE_TERRAIN_CLASS} from '../civilian-duration.mjs';
import {createGame,command,resolveTurn} from '../engine.mjs';
import {nearby,worldIndex} from '../world.mjs';
const native=JSON.parse(readFileSync(new URL('../../outputs/Native-civilian-duration-audit.json',import.meta.url)));
test('all displayed terrains match native road/rail SetOrders duration captures',()=>{
 for(let terrain=0;terrain<18;terrain++)for(const order of [5,6]){
  const captured=native.cases.find(c=>c.order===order&&c.terrain===NATIVE_TERRAIN_CLASS[terrain]);
  assert.equal(transportConstructionTurns({terrain}),captured.remaining);
 }
 assert.throws(()=>transportConstructionTurns({terrain:99}),/Invalid/);
});
test('mountain road remains unfinished for two turns then completes on third',()=>{
 let s=createGame();const u=s.civilians.find(c=>c.owner==='england'&&c.type==='engineer'),source=s.tiles.find(t=>t.id===u.tile);
 source.terrain=0;const target=nearby(source,worldIndex(s)).find(t=>t.owner==='england');target.road=false;target.terrain=8;
 s=command(s,'england',{type:'civilian',unit:u.id,job:'road',tile:target.id});assert.equal(s.civilians.find(c=>c.id===u.id).order.remaining,3);assert.equal(s.civilians.find(c=>c.id===u.id).tile,target.id);assert.equal(s.civilians.find(c=>c.id===u.id).order.from,source.id);
 s=resolveTurn(s);assert.equal(s.tiles.find(t=>t.id===target.id).road,false);
 s=resolveTurn(s);assert.equal(s.tiles.find(t=>t.id===target.id).road,false);
 s=resolveTurn(s);assert.equal(s.tiles.find(t=>t.id===target.id).road,true);
});


test('leaving mountains for plains uses destination timing, not starting terrain',()=>{
 let s=createGame();const u=s.civilians.find(c=>c.owner==='england'&&c.type==='engineer'),source=s.tiles.find(t=>t.id===u.tile);
 source.terrain=8;const target=nearby(source,worldIndex(s)).find(t=>t.owner==='england');target.terrain=0;target.road=false;
 s=command(s,'england',{type:'civilian',unit:u.id,job:'road',tile:target.id});assert.equal(s.civilians.find(c=>c.id===u.id).order.remaining,1);
 s=resolveTurn(s);assert.equal(s.tiles.find(t=>t.id===target.id).road,true);
});
