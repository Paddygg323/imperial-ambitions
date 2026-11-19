import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,loadGame,saveGame} from '../engine.mjs';import {seaKnowledge} from '../sea-knowledge.mjs';
import {revealCoast} from '../overseas.mjs';import {resolveFleets} from '../navy.mjs';
test('frontier sea is selectable before discovery; actual arrival reveals sea and New World coastline',()=>{
 let s=createGame({transportModel:'ports'});const k=seaKnowledge(s);assert.ok(k.frontier.size);
 const first=[...k.frontier][0];assert.equal(k.known.has(first),false);
 const hidden=s.seas.zones.find(z=>z.coast.some(id=>!s.nations.england.revealed.includes(id))&&z.adjacent.length);
 assert.ok(hidden);const start=hidden.adjacent[0];revealCoast(s,'england',start);
 const ship=s.ships.find(u=>u.owner==='england');ship.location=start;ship.order=null;
 s.ships=[ship];s.armies=[];
 const before=[...s.nations.england.revealed];s=command(s,'england',{type:'fleet',ships:[ship.id],job:'sail',zone:hidden.id});
 assert.deepEqual(s.nations.england.revealed,before,'preview must not discover coast');
 resolveFleets(s);assert.ok(s.nations.england.seenSea.includes(hidden.id));
 for(const tile of hidden.coast)assert.ok(s.nations.england.revealed.includes(tile));
 assert.ok(s.nations.england.revealed.length>before.length);
});

test('stationary ship reveals exactly its own and adjacent seas at turn end, including coastline',()=>{
 const s=createGame({transportModel:'ports'}),ship=s.ships.find(u=>u.owner==='england');s.ships=[ship];s.armies=[];ship.location='sea49';ship.order=null;
 s.nations.england.seenSea=[];const zone=s.seas.zones.find(z=>z.id===ship.location),expected=[zone.id,...zone.adjacent];
 resolveFleets(s);
 assert.deepEqual(new Set(s.nations.england.seenSea),new Set(expected));
 for(const z of s.seas.zones.filter(z=>expected.includes(z.id)))for(const tile of z.coast)assert.ok(s.nations.england.revealed.includes(tile));
 assert.ok(s.seas.zones.some(z=>!s.nations.england.seenSea.includes(z.id)),'must not recursively reveal the whole world');
});
test('saved fleet position gains adjacent visibility without revealing pending destination',()=>{
 const s=createGame({transportModel:'ports'}),ship=s.ships.find(u=>u.owner==='england');s.ships=[ship];ship.location='sea49';ship.order=null;s.nations.england.seenSea=[];
 const loaded=loadGame(saveGame(s));const zone=s.seas.zones.find(z=>z.id===ship.location);
 assert.deepEqual(new Set(loaded.nations.england.seenSea),new Set([zone.id,...zone.adjacent]));
 assert.deepEqual(loaded.ships,s.ships);
});
