import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,saveGame,loadGame,finishTurnEconomy} from '../engine.mjs';import {registerTransportRoot,commitTransportNetworkOrder} from '../transport-network-state.mjs';import {conquerProvince} from '../conquest.mjs';
test('new campaigns record capitals, finished engineer ports append once and survive reload',()=>{
 let s=createGame();const capital=s.nations.england.capital;assert.deepEqual(s.nations.england.transportRoots,[capital]);
 assert.deepEqual(s.nations.england.transportAssignments[capital],{automatic:true,assigned:Array(28).fill(0)});
 const tile=s.tiles.find(t=>t.owner==='england'&&!t.port),engineer=s.civilians.find(c=>c.owner==='england'&&c.type==='engineer');
 engineer.order={job:'port',tile:tile.id,remaining:1};s=finishTurnEconomy({...s,turnPhase:'combat'});
 assert.equal(s.tiles.find(t=>t.id===tile.id).port,true);assert.deepEqual(s.nations.england.transportRoots,[capital,tile.id]);
 registerTransportRoot(s,'england',tile.id);s=loadGame(saveGame(s));assert.deepEqual(s.nations.england.transportRoots,[capital,tile.id]);
 assert.deepEqual(s.nations.england.transportAssignments[tile.id],{automatic:false,assigned:Array(28).fill(0)});
 const native=JSON.parse(readFileSync(new URL('../../outputs/Native-port-state-audit.json',import.meta.url)));
 for(const r of [s.nations.england.transportAssignments[tile.id],s.nations.england.transportAssignments[capital]]){
  const reference=native.initialization.find(c=>c.automatic===r.automatic);assert.deepEqual(r.assigned,reference.assigned);
 }
 s.nations.england.transportAssignments[tile.id].assigned[20]=7;
 commitTransportNetworkOrder(s,'england',[{root:tile.id},{root:capital}]);assert.deepEqual(loadGame(saveGame(s)).nations.england.transportRoots,[tile.id,capital]);
 assert.equal(loadGame(saveGame(s)).nations.england.transportAssignments[tile.id].assigned[20],7);
 assert.throws(()=>commitTransportNetworkOrder(s,'england',[{root:capital}]),/preserve/);
});
test('captured ports move to conqueror list and legacy unknown history stays unknown',()=>{
 const s=createGame(),target=s.provinces.find(p=>p.town===s.nations.france.capital),root=s.nations.france.capital;
 s.nations.france.transportAssignments[root].assigned[1]=3;
 conquerProvince(s,target.id,'england');assert.ok(s.nations.england.transportRoots.includes(root));assert.ok(!s.nations.france.transportRoots.includes(root));
 assert.equal(s.nations.england.transportAssignments[root].automatic,false);
 const native=JSON.parse(readFileSync(new URL('../../outputs/Native-port-state-audit.json',import.meta.url)));
 assert.equal(s.nations.england.transportAssignments[root].automatic,native.capitalConversion.automatic);
 assert.equal(s.nations.england.transportAssignments[root].assigned[1],3);
 assert.equal(s.nations.france.transportAssignments[root],undefined);
 delete s.nations.england.transportAssignments;delete s.nations.england.transportRoots;registerTransportRoot(s,'england',root);assert.equal(loadGame(saveGame(s)).nations.england.transportRoots,undefined);
 s.nations.england.transportRoots=[root,root];assert.throws(()=>saveGame(s),/Invalid transport roots/);
});

test('invalid saved network assignments fail validation; legacy saves remain explicitly unknown',()=>{
 const s=createGame(),root=s.nations.england.capital;
 for(const bad of [-1,32768,0.5,null]){const copy=structuredClone(s);copy.nations.england.transportAssignments[root].assigned[0]=bad;assert.throws(()=>saveGame(copy),/Invalid transport assignments/);}
 const missing=structuredClone(s);delete missing.nations.england.transportAssignments[root];assert.throws(()=>saveGame(missing),/Invalid transport assignments/);
 delete s.nations.england.transportAssignments;
 assert.equal(loadGame(saveGame(s)).nations.england.transportAssignments,undefined);
});
