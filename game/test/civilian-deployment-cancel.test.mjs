import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame,finishTurnEconomy} from '../engine.mjs';
for(const type of ['engineer','explorer','builder'])test(`${type} cancelled deployment restores origin across reload`,()=>{
 let s=createGame(),u=s.civilians.find(c=>c.owner==='england'&&c.type===type),from=u.tile;
 const to=s.tiles.find(t=>t.owner==='england'&&t.id!==from).id;
 s=command(s,'england',{type:'civilian',unit:u.id,job:'move',tile:to});
 assert.equal(s.civilians.find(c=>c.id===u.id).tile,to);
 s=loadGame(saveGame(s));s=command(s,'england',{type:'cancelCivilian',unit:u.id});
 assert.equal(s.civilians.find(c=>c.id===u.id).tile,from);assert.equal(s.civilians.find(c=>c.id===u.id).order,null);
});
test('completed deployment remains committed and cannot be cancelled',()=>{
 let s=createGame();const u=s.civilians.find(c=>c.owner==='england'&&c.type==='engineer'),to=s.tiles.find(t=>t.owner==='england'&&t.id!==u.tile).id;
 s=command(s,'england',{type:'civilian',unit:u.id,job:'move',tile:to});s.turnPhase='combat';s=finishTurnEconomy(s);
 assert.equal(s.civilians.find(c=>c.id===u.id).tile,to);
 assert.throws(()=>command(s,'england',{type:'cancelCivilian',unit:u.id}),/No civilian order/);
});
