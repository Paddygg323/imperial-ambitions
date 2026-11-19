import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame,transport} from '../engine.mjs';
import {fleetMoves,fleetRoute,resolveFleets,blockadeTarget} from '../navy.mjs';
import {portSeas} from '../overseas.mjs';
function fixture(){
 const s=createGame({transportModel:'ports'}),minor=Object.values(s.minors).find(m=>s.provinces.some(p=>!p.old&&p.owner===m.id)&&portSeas(s,m.capital).length);
 minor.colonyOf='england';const port=s.tiles.find(t=>t.id===minor.capital),zone=portSeas(s,port.id)[0],ship=s.ships.find(u=>u.owner==='england');
 ship.location=zone;ship.order=null;s.nations.england.revealed.push(port.id);s.nations.france.revealed.push(port.id);
 return {s,minor,port,zone,ship};
}
test('parent fleet anchors at colonial capital through orders/reload/resolution without domestic resource transfer',()=>{
 let {s,minor,port,zone,ship}=fixture();const cargo=transport(s,'england').incoming;
 assert.ok(fleetMoves(s,[ship]).some(m=>m.zone==='port:'+port.id));
 assert.equal(fleetRoute(s,'france',zone,'port:'+port.id),null);
 s=command(s,'england',{type:'fleet',ships:[ship.id],job:'sail',zone:'port:'+port.id});s=loadGame(saveGame(s));resolveFleets(s);
 assert.equal(s.ships.find(u=>u.id===ship.id).location,'port:'+port.id);
 assert.equal(s.tiles.find(t=>t.id===port.id).owner,minor.id);assert.deepEqual(transport(s,'england').incoming,cargo);
 s=command(s,'england',{type:'fleet',ships:[ship.id],job:'sail',zone});resolveFleets(s);
 assert.equal(s.ships.find(u=>u.id===ship.id).location,zone);
});
test('changing colonial parent cancels queued arrival rather than occupying a foreign port',()=>{
 let {s,minor,port,zone,ship}=fixture();s=command(s,'england',{type:'fleet',ships:[ship.id],job:'sail',zone:'port:'+port.id});
 s.minors[minor.id].colonyOf='spain';resolveFleets(s);
 assert.equal(s.ships.find(u=>u.id===ship.id).location,zone);assert.equal(s.ships.find(u=>u.id===ship.id).order,null);
 assert.ok(s.reports.some(r=>r.kind==='navy'&&/no longer controlled/.test(r.text)));
});
test('colonial port blockade requires parent war, never a separate attack on own colony',()=>{
 const {s,minor,port,zone}=fixture();assert.throws(()=>blockadeTarget(s,'france',port.id,zone),/enemy port/);
 s.wars=[['france',minor.id]];assert.throws(()=>blockadeTarget(s,'france',port.id,zone),/enemy port/);
 s.wars=[['france','england']];assert.equal(blockadeTarget(s,'france',port.id,zone),port);
 assert.throws(()=>blockadeTarget(s,'england',port.id,zone),/enemy port/);
});
