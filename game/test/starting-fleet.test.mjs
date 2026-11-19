import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,command,saveGame,loadGame} from '../engine.mjs';
import {homeCargo} from '../economy.mjs';
import {fleetMoves} from '../navy.mjs';
import {merchantRosters} from '../campaign-merchant.mjs';
test('six great powers receive the native three-carrack grant with two defending',()=>{
 const s=createGame(),audit=JSON.parse(readFileSync(new URL('../../outputs/Native-starting-fleet-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,6);
 for(const id of Object.keys(s.nations)){
  const ships=s.ships.filter(ship=>ship.owner===id);
  assert.equal(ships.length,3);assert.ok(ships.every(ship=>ship.type==='carrack'&&ship.hp===25&&ship.location==='home'));
  assert.deepEqual(ships.map(ship=>ship.sleep),audit.cases[0].rawStatus38.map(v=>v===2));
  assert.equal(homeCargo(s,id),9);assert.equal(merchantRosters(s)[id].cargo,9);
 }
});
test('defending ships retain cargo, accept manual sailing and preserve state through saves',()=>{
 let s=createGame();const id=s.ships.find(ship=>ship.owner==='england').id;
 s=loadGame(saveGame(s));assert.equal(s.ships.find(ship=>ship.id===id).sleep,true);
 s=command(s,'england',{type:'fleet',ships:[id],job:'wake'});assert.equal(homeCargo(s,'england'),9);
 s=command(s,'england',{type:'fleet',ships:[id],job:'defend'});
 const zone=fleetMoves(s,[s.ships.find(ship=>ship.id===id)])[0].zone;
 s=command(s,'england',{type:'fleet',ships:[id],job:'sail',zone});
 assert.equal(s.ships.find(ship=>ship.id===id).sleep,false);assert.equal(homeCargo(s,'england'),6);
 assert.throws(()=>command(s,'england',{type:'fleet',ships:[id],job:'defend'}),/Cancel the mission/);
 s=command(s,'england',{type:'fleet',ships:[id],job:'cancel'});assert.equal(homeCargo(s,'england'),9);
 delete s.ships[0].sleep;assert.doesNotThrow(()=>loadGame(saveGame(s)));
 s.ships[0].sleep=2;assert.throws(()=>saveGame(s),/defend state/);
});
