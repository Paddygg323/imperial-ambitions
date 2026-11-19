import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,resolveTurn} from '../engine.mjs';
import {homeCargo} from '../economy.mjs';
import {shipSea,fleetMoves} from '../navy.mjs';
import {seaPath,seaDistance} from '../overseas.mjs';
function fixture(){const s=createGame({simpleFood:true});s.nations={england:s.nations.england};s.ships=s.ships.filter(s=>s.owner==='england').slice(0,1);s.civilians=s.civilians.filter(s=>s.owner==='england');return s;}
test('departure reserves the fleet away from trade; cancellation restores cargo',()=>{
 let s=fixture();const ship=s.ships[0],move=fleetMoves(s,[ship])[0];assert.ok(move);assert.equal(homeCargo(s,'england'),3);
 s=command(s,'england',{type:'fleet',ships:[ship.id],job:'sail',zone:move.zone});assert.equal(homeCargo(s,'england'),0);
 s=command(s,'england',{type:'fleet',ships:[ship.id],job:'cancel'});assert.equal(homeCargo(s,'england'),3);
});
test('fleet movement is range checked and ships return to merchant service next turn',()=>{
 let s=fixture();const ship=s.ships[0],from=shipSea(s,ship),far=s.seas.zones.find(z=>seaDistance(s.seas,from,z.id)>3);
 assert.throws(()=>command(s,'england',{type:'fleet',ships:[ship.id],job:'sail',zone:far.id}),/range/);
 const to=fleetMoves(s,[ship])[0].zone;s=command(s,'england',{type:'fleet',ships:[ship.id],job:'sail',zone:to});s=resolveTurn(s);
 assert.equal(s.ships[0].location,to);assert.equal(homeCargo(s,'england'),0);
 s=command(s,'england',{type:'fleet',ships:[ship.id],job:'sail',zone:'home'});assert.equal(homeCargo(s,'england'),0);s=resolveTurn(s);assert.equal(homeCargo(s,'england'),3);
});
test('actual sailing reaches a New World coast and permits an explorer landing',()=>{
 let s=fixture();const shipId=s.ships[0].id;
 const newTiles=new Set(s.tiles.filter(t=>!s.provinces.find(p=>p.id===t.province).old).map(t=>t.id));
 const target=s.seas.zones.filter(z=>z.coast.some(id=>newTiles.has(id))).sort((a,b)=>seaDistance(s.seas,shipSea(s,s.ships[0]),a.id)-seaDistance(s.seas,shipSea(s,s.ships[0]),b.id))[0];
 const landing=target.coast.find(id=>newTiles.has(id)),explorer=s.civilians.find(c=>c.type==='explorer');
 assert.throws(()=>command(s,'england',{type:'civilian',unit:explorer.id,job:'move',tile:landing}),/Reveal/);
 for(let i=0;i<20&&shipSea(s,s.ships[0])!==target.id;i++){
  const move=fleetMoves(s,[s.ships[0]]).filter(m=>m.zone.startsWith('sea')).sort((a,b)=>seaDistance(s.seas,a.zone,target.id)-seaDistance(s.seas,b.zone,target.id))[0];
  assert.ok(move);const zone=move.zone;
  s=command(s,'england',{type:'fleet',ships:[shipId],job:'sail',zone});s=resolveTurn(s);
 }
 assert.ok(s.nations.england.revealed.includes(landing));
 s=command(s,'england',{type:'civilian',unit:explorer.id,job:'move',tile:landing});s=resolveTurn(s);
 assert.ok(s.nations.england.prospected.includes(landing));assert.equal(s.civilians.find(c=>c.id===explorer.id).order,null);
});

test('damaged ships repair at sea and home each turn, capped at maximum hull',()=>{
 let s=fixture();const id=s.ships[0].id,to=fleetMoves(s,[s.ships[0]])[0].zone;s.ships[0].hp=1;
 s=command(s,'england',{type:'fleet',ships:[id],job:'sail',zone:to});s=resolveTurn(s);
 assert.equal(s.ships[0].location,to);assert.equal(s.ships[0].hp,7);
 assert.ok(s.reports.findIndex(r=>r.kind==='shipRepair')<s.reports.findIndex(r=>r.kind==='navy'));
 s=resolveTurn(s);assert.equal(s.ships[0].hp,13);
 s=command(s,'england',{type:'fleet',ships:[id],job:'sail',zone:'home'});s=resolveTurn(s);assert.equal(s.ships[0].hp,19);
 s=resolveTurn(s);assert.equal(s.ships[0].hp,25);
 s=resolveTurn(s);assert.equal(s.ships[0].hp,25);assert.equal(s.reports.filter(r=>r.kind==='shipRepair').length,0);
});
