import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,resolveTurn} from '../engine.mjs';
import {canDeployCivilian} from '../civilian-access.mjs';
function order(s,type,tile){return command(s,'england',{type:'civilian',unit:s.civilians.find(u=>u.owner==='england'&&u.type===type).id,job:'move',tile:tile.id});}
test('rival Great Power admits spies only, without mistaking an embassy for access',()=>{
 const s=createGame(),t=s.tiles.find(t=>t.owner==='france');s.nations.england.embassies=['france'];
 for(const type of ['builder','engineer','explorer'])assert.throws(()=>order(s,type,t),/cannot enter/);
 s.civilians.push({id:'spy',type:'spy',owner:'england',tile:s.nations.england.capital,order:null});
 const next=order(s,'spy',t);assert.equal(next.civilians.find(u=>u.id==='spy').tile,t.id);
 assert.equal(s.civilians.find(u=>u.id==='spy').tile,s.nations.england.capital);
});
test('engineer and explorer deploy to minors; builder and infrastructure need embassy',()=>{
 const s=createGame(),t=s.tiles.find(t=>t.owner==='scotland');
 for(const type of ['engineer','explorer'])assert.doesNotThrow(()=>order(s,type,t));
 assert.throws(()=>order(s,'builder',t),/cannot enter/);
 s.nations.england.embassies=['scotland'];const next=order(s,'builder',t);
 assert.equal(next.civilians.find(u=>u.owner==='england'&&u.type==='builder').tile,t.id);
 const engineer=s.civilians.find(u=>u.owner==='england'&&u.type==='engineer');engineer.tile=t.id;s.nations.england.embassies=[];
 assert.throws(()=>command(s,'england',{type:'civilian',unit:engineer.id,job:'port',tile:t.id}),/owned land/);
});
test('foreign movement completes, but access is rechecked if a Great Power takes the destination',()=>{
 const s=createGame(),t=s.tiles.find(t=>t.owner==='scotland');let next=order(s,'engineer',t);
 next=resolveTurn(next);assert.ok(next.reports.every(r=>!r.text?.includes('Work cancelled')));
 next=order(s,'explorer',t);next.tiles.find(q=>q.id===t.id).owner='france';next=resolveTurn(next);
 assert.ok(next.reports.some(r=>r.nation==='england'&&r.text?.includes('Work cancelled')));
});
test('own overseas land permits every civilian without requiring shipping',()=>{
 const s=createGame(),t=s.tiles.find(t=>!s.provinces.find(p=>p.id===t.province).old);t.owner='england';
 for(const type of ['builder','engineer','explorer','spy','merchant','railBuilder'])assert.ok(canDeployCivilian(s,'england',{type,owner:'england'},t));
});

test('owned overseas exploration completes after reload without a prior sea-discovery entry',async()=>{
 const {finishTurnEconomy,saveGame,loadGame}=await import('../engine.mjs');
 const s=createGame(),p=s.provinces.find(p=>!p.old),t=s.tiles.find(t=>t.province===p.id);
 p.owner='england';for(const q of s.tiles.filter(q=>q.province===p.id))q.owner='england';
 s.nations.england.revealed=s.nations.england.revealed.filter(id=>id!==t.id);
 let next=order(s,'explorer',t);next=finishTurnEconomy({...loadGame(saveGame(next)),turnPhase:'combat'});
 assert.ok(next.nations.england.revealed.includes(t.id));
 assert.ok(next.nations.england.prospected.includes(t.id));
 assert.equal(next.civilians.find(u=>u.owner==='england'&&u.type==='explorer').order,null);
});
