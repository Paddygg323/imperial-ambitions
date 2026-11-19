import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {refreshInteriorPlanning} from '../campaign-interior-planning.mjs';
import {campaignDemandForecast} from '../campaign-demand-forecast.mjs';
test('planning refresh replaces history as roads and development change, then persists',()=>{
 let s=createGame();s.nations.france.known=['8','9','11'];
 const tile=s.tiles.find(t=>t.owner==='france'&&t.resource==='grain');assert.ok(tile);tile.level=0;
 const options={entries:[{tile:tile.id,roadDistance:1,portDistance:0}],priorities:Array(28).fill(1),transport:{connections:{[tile.id]:{capacity:0}}}};
 let before=structuredClone(s),r=refreshInteriorPlanning(s,'france',options);
 assert.equal(r.unused[20],1);assert.equal(s.nations.france.interiorPlanning.unused[20],1);
 before.nations.france.interiorPlanning=structuredClone(s.nations.france.interiorPlanning);assert.deepEqual(s,before);
 options.transport.connections[tile.id].capacity=4;r=refreshInteriorPlanning(s,'france',options);
 assert.equal(r.unused[20],0);assert.equal(r.undeveloped[20],2);
 const demand=campaignDemandForecast(s,'france');
 assert.equal(demand.reinforcement.input.undeveloped[0],2,'full forecast consumes recorded preceding planning pass');
 r.undeveloped[20]=999;assert.equal(s.nations.france.interiorPlanning.undeveloped[20],2);
 tile.level=2;r=refreshInteriorPlanning(s,'france',options);assert.equal(r.undeveloped[20],0);
 s=loadGame(saveGame(s));assert.equal(s.nations.france.interiorPlanning.undeveloped[20],0);
 assert.equal(s.nations.spain.interiorPlanning.tiles[20],0);
});
test('incomplete route information leaves recorded planning history intact',()=>{
 const s=createGame(),before=JSON.stringify(s);
 assert.throws(()=>refreshInteriorPlanning(s,'france',{transport:{connections:{}},entries:[{tile:'missing',roadDistance:0,portDistance:0}],priorities:Array(28).fill(1)}),/eligible/);
 assert.equal(JSON.stringify(s),before);
 delete s.nations.england.interiorPlanning;
 assert.throws(()=>refreshInteriorPlanning(s,'england'),/Recorded/);
});
