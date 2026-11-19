import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {provinceAdjacency} from '../world.mjs';
import {planLandAttack,stageLandAttacks} from '../land-attack.mjs';
import {beachheadTarget} from '../beachhead.mjs';
import {tribalInvestors} from '../diplomacy.mjs';

function fixture(){
 const s=createGame(),adj=provinceAdjacency(s);
 const source=s.provinces.find(p=>p.owner==='england'&&[...adj[p.id]].some(id=>s.provinces.find(q=>q.id===id).owner!=='england'));
 const p=s.provinces.find(p=>p.owner!=='england'&&adj[source.id].has(p.id));
 p.old=false;p.owner='tribe';
 const tiles=s.tiles.filter(t=>t.province===p.id);
 for(const t of tiles)t.owner='tribe';
 tiles[0].purchasedBy='france';
 s.armies=[{id:'a',owner:'england',province:source.id,type:'pikeman',hp:100,order:null}];
 s.seas={zones:[{id:'test-coast',coast:[tiles[0].id]}]};
 // This synthetic ocean replaces the historical endpoint coordinate system.
 for(const t of s.tiles)delete t.transportSeaTile;
 s.nations.england.revealed.push(tiles[0].id);
 return {s,p,t:tiles[0]};
}
test('tile purchase protects tribal land and beachhead after save/load; pending war is insufficient',()=>{
 const f=fixture(),s=loadGame(saveGame(f.s)),p=s.provinces.find(p=>p.id===f.p.id);
 s.declarations=[{nation:'england',target:'france'}];
 assert.throws(()=>planLandAttack(s,'england',['a'],p.id),/investing power/);
 assert.throws(()=>beachheadTarget(s,'england',p.id,'test-coast'),/investing power/);
 s.wars=[['england','france']];
 assert.equal(planLandAttack(s,'england',['a'],p.id).province,p.id);
 assert.equal(beachheadTarget(s,'england',p.id,'test-coast').id,p.id);
 s.armies[0].order={job:'attack',province:p.id};s.wars=[];
 stageLandAttacks(s);
 assert.deepEqual(s.pendingLandAttacks,[]);
 assert.equal(s.armies[0].order,null);
 assert.match(s.reports.at(-1).text,/investing power/);
});
test('claim protection is local to living investors in tribal provinces',()=>{
 const {s,p,t}=fixture();
 assert.deepEqual(tribalInvestors(s,p),['france']);
 t.purchasedBy='england';assert.doesNotThrow(()=>planLandAttack(s,'england',['a'],p.id));
 t.purchasedBy='france';p.old=true;assert.deepEqual(tribalInvestors(s,p),[]);
 p.old=false;p.owner='portugal';assert.deepEqual(tribalInvestors(s,p),[]);
 p.owner='tribe';s.nations.france.alive=false;assert.deepEqual(tribalInvestors(s,p),[]);
 s.nations.france.alive=true;t.owner='portugal';assert.deepEqual(tribalInvestors(s,p),[]);
});
