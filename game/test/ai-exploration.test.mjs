import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame} from '../engine.mjs';
import {explorationOrder,planExploration} from '../ai-exploration.mjs';
import {resolveFleets} from '../navy.mjs';import {homeCargo} from '../economy.mjs';
function fixture(){const s=createGame();s.ships=s.ships.filter((ship,i,all)=>all.findIndex(u=>u.owner===ship.owner)===i);const ship=s.ships.find(u=>u.owner==='france');s.ships.push({...structuredClone(ship),id:'extra-exploration-carrack'});return s;}
test('exploration preserves home cargo and persists an actual fleet order through reload',()=>{
 const single=createGame();single.ships=single.ships.filter((ship,i,all)=>all.findIndex(u=>u.owner===ship.owner)===i);assert.equal(explorationOrder(single,'france'),null);
 const s=fixture(),order=explorationOrder(s,'france');assert.ok(order);
 let next=planExploration(s,'france',command);assert.equal(homeCargo(next,'france'),3);
 const before=next.nations.france.seenSea.length;next=loadGame(saveGame(next));resolveFleets(next);
 assert.ok(next.nations.france.seenSea.length>before);
 assert.equal(next.ships.find(u=>u.id===order.ships[0]).location,order.zone);
 assert.equal(s.nations.france.seenSea.length,0,'planning does not reveal anything');
});
test('exploration choices do not depend on hidden New World resources or ownership',()=>{
 const s=fixture(),a=explorationOrder(s,'france');
 for(const t of s.tiles)if(!s.nations.france.revealed.includes(t.id)){t.resource='gold';t.owner='england';}
 for(const z of s.seas.zones)z.coast=[];
 assert.deepEqual(explorationOrder(s,'france'),a);
});
test('player fleets, damaged ships and existing missions are not taken over',()=>{
 const s=fixture();assert.equal(explorationOrder(s,'england'),null);
 for(const ship of s.ships.filter(u=>u.owner==='france'))ship.hp=1;
 assert.equal(explorationOrder(s,'france'),null);
});


test('idle combat ships at sea are not repurposed as explorers',()=>{
 const s=fixture();const zone=s.seas.zones[0].id;
 for(const ship of s.ships.filter(u=>u.owner==='france'))Object.assign(ship,{type:'galleon',hp:50,cargo:6,location:zone});
 assert.equal(explorationOrder(s,'france'),null);
});
