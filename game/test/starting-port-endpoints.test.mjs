import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {portExit} from '../river-routes.mjs';
import {domesticCheckpoints} from '../transport-routes.mjs';
test('new historical campaigns persist restricted initial exits for every capital',()=>{
 for(const seed of [1500,1501,42]){
  const s=createGame({seed}),loaded=loadGame(saveGame(s));
  for(const n of [...Object.values(s.nations),...Object.values(s.minors)]){
   const t=s.tiles.find(t=>t.id===n.capital),exit=portExit(s,t,{restricted:true});
   assert.ok(exit,`${seed} ${n.id} has an initial sea exit`);
   assert.equal(t.transportSeaTile,exit.id);
   assert.equal(loaded.tiles.find(q=>q.id===t.id).transportSeaTile,exit.id);
   assert.equal(domesticCheckpoints(s,{nation:n.id,sourcePort:t.id,destinationPort:t.id})[0].sea,s.seas.cellZones[exit.id]);
  }
 }
});
