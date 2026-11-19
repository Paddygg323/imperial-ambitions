import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../engine.mjs';
import {fleetAnchor,fleetDisplayLocation,seaName} from '../map-markers.mjs';
import {portSeas} from '../overseas.mjs';
test('pending fleet display follows destination without committing movement and restores on cancel',()=>{
 const ship={location:'home',order:{job:'sail',destination:'sea2'}};
 assert.equal(fleetDisplayLocation(ship),'sea2');assert.equal(ship.location,'home');
 assert.equal(fleetDisplayLocation(JSON.parse(JSON.stringify(ship))),'sea2');
 ship.order=null;assert.equal(fleetDisplayLocation(ship),'home');
 ship.order={job:'sail',destination:'port:12,13'};assert.equal(fleetDisplayLocation(ship),'port:12,13');
 ship.order={job:'patrol'};assert.equal(fleetDisplayLocation(ship),'home');
});
test('London fleet is at the northeast Thames sea exit, without changing saved ships',()=>{
 const s=createGame(),before=JSON.stringify(s.ships),id=fleetAnchor(s,'home');
 assert.equal(id,'84,21');assert.equal(s.nations.england.capital,'82,23');
 assert.ok(!s.tiles.some(t=>t.id===id));assert.ok(portSeas(s,s.nations.england.capital).includes(s.seas.cellZones[id]));
 assert.equal(JSON.stringify(s.ships),before);
});
test('sea labels are distinct and fleet sea anchors stay inside their region',()=>{
 const s=createGame();assert.equal(new Set(s.seas.zones.map(z=>seaName(s,z))).size,s.seas.zones.length);
 for(const z of s.seas.zones)assert.ok(z.cells.includes(fleetAnchor(s,z.id)));
 assert.equal(fleetAnchor(s,'port:missing'),null);
});
