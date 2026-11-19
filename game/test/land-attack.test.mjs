import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame,beginTurn} from '../engine.mjs';
import {provinceAdjacency} from '../world.mjs';
import {resolveArmies} from '../army.mjs';
import {planLandAttack} from '../land-attack.mjs';

function fixture(){
 const s=createGame(),adj=provinceAdjacency(s);
 const source=s.provinces.find(p=>p.owner==='england'&&[...adj[p.id]].some(id=>s.provinces.find(q=>q.id===id).owner!=='england'));
 const target=s.provinces.find(p=>p.owner!=='england'&&adj[source.id].has(p.id));
 s.armies=[{id:'a',owner:'england',province:source.id,type:'pikeman',hp:100,order:null},{id:'b',owner:'england',province:source.id,type:'arquebusier',hp:80,order:null},{id:'d',owner:target.owner,province:target.id,type:'pikeman',hp:90,order:null}];
 return {s,source,target};
}
test('historical land attack requires war, stages selected regiments and preserves ownership',()=>{
 let {s,source,target}=fixture();
 const action={type:'army',job:'attack',province:target.id,units:['a']};
 assert.throws(()=>command(s,'england',action),/Declare war/);assert.equal(s.armies[0].order,null);
 s.wars=[['england',target.owner]];s=command(s,'england',action);
 s=loadGame(saveGame(s));resolveArmies(s);
 const p=s.pendingLandAttacks[0];assert.equal(p.attacker,'england');assert.deepEqual(p.attackers,[{id:'a',from:source.id}]);assert.deepEqual(p.defenders,['d']);
 assert.equal(s.provinces.find(p=>p.id===target.id).owner,target.owner);
 assert.equal(s.armies[0].province,source.id);assert.equal(s.armies[1].order,null);
 s=loadGame(saveGame(s));assert.throws(()=>beginTurn(s),/pending battles/);
 assert.throws(()=>resolveArmies(s),/pending battles/);
 assert.throws(()=>command(s,'england',{type:'army',job:'done',units:['b']}),/pending battles/);
});
test('land orders reject overseas shortcuts and duplicate or foreign selections atomically',()=>{
 const {s,target}=fixture();s.wars=[['england',target.owner]];
 for(const units of [['a','d'],['a','a'],[]])assert.throws(()=>command(s,'england',{type:'army',job:'attack',province:target.id,units}));
 const overseas=s.provinces.find(p=>!p.old);
 assert.throws(()=>planLandAttack(s,'england',['a'],overseas.id),/port province|beachhead/);
 assert.ok(s.armies.every(u=>u.order===null));
});
test('tribal investment protection and changed relations are rechecked at resolution',()=>{
 let {s,target}=fixture();target.old=false;target.owner='tribe';target.investors=['france'];
 assert.throws(()=>planLandAttack(s,'england',['a'],target.id),/investing power/);
 s.wars=[['england','france']];s=command(s,'england',{type:'army',job:'attack',province:target.id,units:['a','b']});
 s.wars=[];resolveArmies(s);
 assert.deepEqual(s.pendingLandAttacks,[]);assert.ok(s.armies.slice(0,2).every(u=>u.order===null));
 assert.match(s.reports.at(-1).text,/Attack cancelled/);
});
import {landAttackChoices} from '../land-attack.mjs';
test('touch attack choices use the same war, adjacency and existing-order validation',()=>{
 const {s,target}=fixture();
 assert.match(landAttackChoices(s,'england',['a']).find(c=>c.province===target.id).reason,/Declare war/);
 s.wars=[['england',target.owner]];
 assert.equal(landAttackChoices(s,'england',['a']).find(c=>c.province===target.id).allowed,true);
 s.armies[0].order={job:'done'};
 assert.equal(landAttackChoices(s,'england',['a']).find(c=>c.province===target.id).allowed,false);
 assert.deepEqual(landAttackChoices(s,'england',[]),[]);
});

test('independent New World province can be attacked without declaring war',()=>{
 const {s,target}=fixture();target.old=false;target.owner='tribe';target.investors=[];
 assert.equal(s.wars?.length??0,0);
 const next=command(s,'england',{type:'army',job:'attack',province:target.id,units:['a']});
 assert.equal(next.armies.find(u=>u.id==='a').order.province,target.id);assert.equal(next.declarations?.length??0,0);
});

test('a non-aggression pact blocks direct tribal attacks until a declaration settles',()=>{
 const {s,target}=fixture();target.old=false;target.owner='tribe';target.investors=[];
 s.pacts=[['england','tribe']];
 assert.throws(()=>planLandAttack(s,'england',['a'],target.id),/non-aggression pact/);
 assert.equal(s.armies[0].order,null);
 s.pacts=[];s.wars=[['england','tribe']];
 assert.equal(planLandAttack(s,'england',['a'],target.id).defender,'tribe');
});
