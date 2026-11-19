import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {prospected,nearby,worldIndex} from '../world.mjs';
for(const [terrain,resource] of [[8,'iron'],[10,'gold'],[9,'gems']])test(`one explorer deployment discovers ${resource} without a separate prospect order`,()=>{
 let s=createGame({transportModel:'ports'});const tile=s.tiles.find(t=>!s.provinces.find(p=>p.id===t.province).old),u=s.civilians.find(c=>c.owner==='england'&&c.type==='explorer');
 tile.terrain=terrain;tile.resource=resource;tile.prospected=false;s.nations.england.revealed.push(tile.id);
 assert.equal(prospected(s,'england',tile),false);
 s=command(s,'england',{type:'civilian',unit:u.id,job:'move',tile:tile.id});
 assert.equal(prospected(s,'england',s.tiles.find(t=>t.id===tile.id)),false,'order preview must not discover deposits');
 s=resolveTurn(s);assert.equal(s.civilians.find(c=>c.id===u.id).order,null);
 assert.equal(prospected(s,'england',s.tiles.find(t=>t.id===tile.id)),true);
 s=loadGame(saveGame(s));assert.equal(prospected(s,'england',s.tiles.find(t=>t.id===tile.id)),true);
});
