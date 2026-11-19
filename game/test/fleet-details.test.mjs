import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame} from '../engine.mjs';
test('ship naming survives reload without changing an assigned mission or combat attributes',()=>{
 let s=createGame();const ship=s.ships.find(u=>u.owner===s.player);ship.order={job:'patrol',fleet:'test'};ship.aggression=0;ship.experience=42;
 const before=structuredClone(ship);
 s=command(s,s.player,{type:'fleet',job:'rename',ships:[ship.id],name:'  HMS Resolute  '});
 const actual=loadGame(saveGame(s)).ships.find(u=>u.id===ship.id);assert.deepEqual(actual,{...before,name:'HMS Resolute'});
 s=command(s,s.player,{type:'fleet',job:'rename',ships:[ship.id],name:''});assert.deepEqual(s.ships.find(u=>u.id===ship.id),before);
});
test('ship renaming respects ownership and rejects malformed names and multi-ship selection',()=>{
 const s=createGame(),ship=s.ships.find(u=>u.owner===s.player),enemy=s.ships.find(u=>u.owner!==s.player);
 for(const name of [null,44,'x'.repeat(41),'bad\nname'])assert.throws(()=>command(s,s.player,{type:'fleet',job:'rename',ships:[ship.id],name}));
 assert.throws(()=>command(s,s.player,{type:'fleet',job:'rename',ships:[enemy.id],name:'No'}));
 s.ships.push({...ship,id:'other'});assert.throws(()=>command(s,s.player,{type:'fleet',job:'rename',ships:[ship.id,'other'],name:'No'}));
 ship.name={bad:true};assert.throws(()=>loadGame(saveGame(s)),/ship name/);
});
