import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {provinceAdjacency} from '../world.mjs';
import {stageLandAttacks} from '../land-attack.mjs';
import {startLandBattle,commandLandBattle,finishLandBattle} from '../campaign-battle.mjs';
import {chooseBattleAction} from '../battle-ai.mjs';
function fixture(){
 const s=createGame(),adj=provinceAdjacency(s);
 const source=s.provinces.find(p=>p.owner==='england'&&[...adj[p.id]].some(id=>s.provinces.find(q=>q.id===id).owner!=='england'));
 const target=s.provinces.find(p=>p.owner!=='england'&&adj[source.id].has(p.id));target.fort=0;
 s.wars=[['england',target.owner]];
 s.armies=[{id:'a',owner:'england',province:source.id,type:'regular',hp:100,experience:65,order:{job:'attack',province:target.id}},
 {id:'d',owner:target.owner,province:target.id,type:'pikeman',hp:100,experience:80,order:null},
 {id:'home',owner:'england',province:source.id,type:'pikeman',hp:70,experience:0,order:null}];
 stageLandAttacks(s);
 return startLandBattle(s);
}
test('campaign battle completes through legal actions and persists results exactly once',()=>{
 let s=fixture();const attack=s.activeLandBattle.attack;
 for(const nation of [attack.attacker,attack.defender])while(!s.activeLandBattle.battle.ready[nation===attack.attacker?0:1])s=commandLandBattle(s,nation,chooseBattleAction(s.activeLandBattle.battle,nation));
 let steps=0;
 while(s.activeLandBattle.battle.phase!=='finished'&&steps++<600){
  s=loadGame(saveGame(s));const b=s.activeLandBattle.battle,nation=b.activeSide===0?attack.attacker:attack.defender;
  s=commandLandBattle(s,nation,chooseBattleAction(b,nation));
 }
 assert.equal(s.activeLandBattle.battle.phase,'finished');
 const winner=s.activeLandBattle.battle.winner,before=saveGame(s);
 const done=finishLandBattle(s);assert.equal(saveGame(s),before);
 assert.equal(done.provinces.find(p=>p.id===attack.province).owner,winner);
 assert.ok(done.tiles.filter(t=>t.province===attack.province).every(t=>t.owner===winner));
 assert.equal(done.activeLandBattle,undefined);assert.equal(done.pendingLandAttacks.length,0);
 assert.deepEqual(done.armies.find(u=>u.id==='home'),s.armies.find(u=>u.id==='home'));
 for(const u of done.armies.filter(u=>u.id!=='home'))assert.equal(u.order,null);
 assert.throws(()=>finishLandBattle(loadGame(saveGame(done))),/No active/);
 assert.ok(done.reports.some(r=>r.kind==='battle'));
});
test('stale, incomplete and duplicate rosters cannot partially change the campaign',()=>{
 const s=fixture(),before=saveGame(s);assert.throws(()=>finishLandBattle(s),/not finished/);assert.equal(saveGame(s),before);
 s.activeLandBattle.battle.phase='finished';s.activeLandBattle.battle.winner='england';
 s.armies[0].hp=99;const changed=saveGame(s);assert.throws(()=>finishLandBattle(s),/regiment changed/);assert.equal(saveGame(s),changed);
 s.armies[0].hp=100;s.activeLandBattle.battle.units.push({...s.activeLandBattle.battle.units[0]});assert.throws(()=>finishLandBattle(s),/roster changed/);
});
test('defender victory preserves ownership, returns attackers, and carries damage and medals',()=>{
 const s=fixture(),a=s.activeLandBattle;
 a.battle.phase='finished';a.battle.winner=a.attack.defender;
 a.battle.units[0].hp=36;a.battle.units[0].state=2;a.battle.units[0].escaped=true;
 a.battle.units[1].hp=29;
 const done=finishLandBattle(s),attacker=done.armies.find(u=>u.id==='a'),defender=done.armies.find(u=>u.id==='d');
 assert.equal(done.seed,s.seed,'attacker retreat does not consume a random draw');
 assert.equal(attacker.province,a.attack.attackers[0].from);assert.equal(attacker.hp,36);assert.equal(attacker.experience,85);
 assert.equal(defender.hp,29);assert.equal(defender.experience,115);assert.equal(defender.medals,1);
 assert.equal(done.provinces.find(p=>p.id===a.attack.province).owner,a.attack.defender);
});
test('conquest removes encircled survivors, changes tile ownership, and leaves other armies intact',()=>{
 const s=fixture(),a=s.activeLandBattle,adj=provinceAdjacency(s);
 for(const id of adj[a.attack.province])s.provinces.find(p=>p.id===id).owner='england';
 a.battle.phase='finished';a.battle.winner='england';a.battle.units[0].hp=42;a.battle.units[1].hp=20;
 const done=finishLandBattle(loadGame(saveGame(s)));
 assert.equal(done.armies.find(u=>u.id==='a').experience,100);
 assert.equal(done.armies.find(u=>u.id==='a').medals,1);
 assert.equal(done.armies.find(u=>u.id==='a').hp,42);
 assert.equal(done.armies.find(u=>u.id==='a').province,a.attack.province);
 assert.equal(done.seed,s.seed,'encirclement does not consume a random draw');
 assert.equal(done.armies.find(u=>u.id==='d'),undefined);
 assert.ok(done.armies.find(u=>u.id==='home'));
 assert.ok(done.reports.at(-1).retreats.some(r=>r.id==='d'&&r.destroyed));
});
import {refreshLandAttacks} from '../land-attack.mjs';
function contested(war){
 const s=createGame(),adj=provinceAdjacency(s),target=s.provinces.find(p=>p.old&&adj[p.id].size>=2),sources=[...adj[target.id]].slice(0,2);
 const owners=new Map([[target.id,'france'],[sources[0],'england'],[sources[1],'spain']]);
 for(const p of s.provinces)if(owners.has(p.id)){p.owner=owners.get(p.id);p.fort=0;}
 for(const t of s.tiles)if(owners.has(t.province))t.owner=owners.get(t.province);
 s.wars=[['england','france'],['spain','france'],...(war?[['england','spain']]:[])];
 s.armies=[...['england','spain'].map((owner,i)=>({id:owner,owner,province:sources[i],type:i===0?'hussar':'regular',hp:100,experience:0,order:{job:'attack',province:target.id}})),{id:'french',owner:'france',province:target.id,type:'pikeman',hp:100,experience:0,order:null}];
 stageLandAttacks(s);return startLandBattle(s);
}
test('later invader cancels against a new owner at peace, preserving its troops',()=>{
 const s=contested(false),a=s.activeLandBattle;
 a.battle.phase='finished';a.battle.winner='england';a.battle.units[0].hp=42;a.battle.units[1].hp=0;a.battle.units[1].state=3;
 const done=finishLandBattle(s);
 assert.equal(done.pendingLandAttacks.length,0);
 const spanish=done.armies.find(u=>u.owner==='spain');assert.equal(spanish.hp,100);assert.equal(spanish.experience,0);assert.equal(spanish.order,null);
 assert.notEqual(spanish.province,a.attack.province);assert.ok(done.reports.some(r=>r.nation==='spain'&&/cancelled/.test(r.text)));
});
test('later enemy fights the new owner at its actual post-battle health and experience',()=>{
 const s=contested(true),a=s.activeLandBattle;
 a.battle.phase='finished';a.battle.winner='england';a.battle.units[0].hp=42;a.battle.units[1].hp=0;a.battle.units[1].state=3;
 const done=finishLandBattle(s);assert.equal(done.pendingLandAttacks[0].defender,'england');assert.deepEqual(done.pendingLandAttacks[0].defenders,['england']);
 const next=startLandBattle(loadGame(saveGame(done)),{activeWidth:29,cells:Array.from({length:464},()=>({terrain:0}))});
 const defender=next.activeLandBattle.battle.units.find(u=>u.side===1);
 assert.equal(defender.owner,'england');assert.equal(defender.hp,42);assert.equal(defender.experience,35);
 assert.equal(next.activeLandBattle.battle.attacker,'spain');
});
test('removed or displaced attackers cancel without resurrecting orders or blocking the turn',()=>{
 const s=contested(true);delete s.activeLandBattle;
 s.armies=s.armies.filter(u=>u.id!=='england');s.armies.find(u=>u.id==='spain').order=null;
 const done=refreshLandAttacks(loadGame(saveGame(s)));
 assert.equal(done.pendingLandAttacks.length,0);assert.equal(done.armies.find(u=>u.id==='england'),undefined);
 assert.equal(done.armies.find(u=>u.id==='spain').order,null);
 assert.throws(()=>refreshLandAttacks(contested(true)),/during a battle/);
});
test('faster attacking army sorts ahead of earlier orders and keeps its initiative after reload',()=>{
 const s=contested(true);delete s.activeLandBattle;s.pendingLandAttacks=[];
 s.armies.find(u=>u.id==='england').type='culverin';s.armies.find(u=>u.id==='spain').type='hussar';
 stageLandAttacks(s);assert.equal(s.pendingLandAttacks[0].attacker,'spain');
 assert.ok(s.pendingLandAttacks[0].initiative>s.pendingLandAttacks[1].initiative);
 const saved=loadGame(saveGame(s)),refreshed=refreshLandAttacks(saved);
 assert.deepEqual(refreshed.pendingLandAttacks,s.pendingLandAttacks);assert.equal(refreshed.seed,s.seed);
});
import {occupyUnopposedProvince} from '../campaign-battle.mjs';
test('undefended unfortified province is occupied without battle, casualties or experience award',()=>{
 const s=fixture();delete s.activeLandBattle;s.armies=s.armies.filter(u=>u.id!=='d');
 const attack=s.pendingLandAttacks[0],before=saveGame(s),unit=s.armies.find(u=>u.id==='a');unit.hp=67;
 const snapshot=saveGame(s),done=startLandBattle(loadGame(snapshot));
 assert.equal(saveGame(s),snapshot);assert.equal(done.activeLandBattle,undefined);assert.equal(done.pendingLandAttacks.length,0);
 const survivor=done.armies.find(u=>u.id==='a');assert.equal(survivor.hp,67);assert.equal(survivor.experience,65);assert.equal(survivor.order,null);assert.equal(survivor.province,attack.province);
 assert.equal(done.provinces.find(p=>p.id===attack.province).owner,'england');assert.ok(done.tiles.filter(t=>t.province===attack.province).every(t=>t.owner==='england'));
 assert.equal(done.seed,s.seed);assert.ok(done.reports.some(r=>r.occupation));assert.throws(()=>occupyUnopposedProvince(done),/No pending/);
});
test('a fort without mobile defenders still opens a battle with its automatic guns',()=>{
 const s=fixture();delete s.activeLandBattle;s.armies=s.armies.filter(u=>u.id!=='d');
 const target=s.provinces.find(p=>p.id===s.pendingLandAttacks[0].province);target.fort=1;
 assert.throws(()=>occupyUnopposedProvince(s),/requires battle/);
 const next=startLandBattle(s);assert.equal(next.activeLandBattle.battle.units.filter(u=>u.emplaced).length,1);
 assert.equal(next.provinces.find(p=>p.id===target.id).owner,target.owner);
});
test('unopposed occupation revalidates the later invader against new ownership',()=>{
 const s=contested(false);delete s.activeLandBattle;s.armies=s.armies.filter(u=>u.id!=='french');
 const done=startLandBattle(s);assert.equal(done.pendingLandAttacks.length,0);assert.equal(done.activeLandBattle,undefined);
 assert.equal(done.armies.find(u=>u.id==='spain').experience,0);assert.equal(done.armies.find(u=>u.id==='spain').order,null);
 assert.ok(done.reports.some(r=>r.nation==='spain'&&/cancelled/.test(r.text)));
});


test('conquest removes local hostile civilians and their work, preserving others through reload',()=>{
 let s=fixture();const attack=s.activeLandBattle.attack,target=s.provinces.find(p=>p.id===attack.province);
 const remote=s.tiles.find(t=>t.province!==target.id),hostile='france',neutral='portugal';
 s.wars.push(['england',hostile]);
 s.civilians=[
  {id:'builderLost',owner:hostile,type:'builder',tile:target.town,order:{job:'develop',remaining:2}},
  {id:'enemySpy',owner:hostile,type:'spy',tile:target.town,order:null},
  {id:'own',owner:'england',type:'explorer',tile:target.town,order:null},
  {id:'neutral',owner:neutral,type:'engineer',tile:target.town,order:null},
  {id:'remote',owner:hostile,type:'builder',tile:remote.id,order:null}
 ];
 // Unopposed branch uses the same conquest operation as a tactical victory.
 delete s.activeLandBattle;s.armies=s.armies.filter(u=>u.id!=='d');
 const before=saveGame(s);const done=startLandBattle(s);
 assert.equal(saveGame(s),before,'caller state is unchanged');
 assert.deepEqual(done.civilians.map(u=>u.id),['own','neutral','remote']);
 assert.equal(done.provinces.find(p=>p.id===target.id).owner,'england');
 assert.equal(done.reports.filter(r=>r.kind==='civilianLoss'&&r.nation==='england').flatMap(r=>r.units).length,2);
 const restored=loadGame(saveGame(done));assert.deepEqual(restored.civilians,done.civilians);
 assert.equal(restored.civilians.some(u=>u.order?.job==='develop'),false);
});

test('a failed assault leaves civilians alive; a fought attacker victory removes them',()=>{
 for(const winner of ['england','defender']){
  const s=fixture(),a=s.activeLandBattle.attack,p=s.provinces.find(p=>p.id===a.province);
  s.wars.push(['england','france']);
  s.civilians.push({id:'local',owner:'france',type:'engineer',tile:p.town,order:null});
  // Direct finished-state fixture isolates campaign consequences; full legal
  // action-to-result flow is tested above and by the browser integration.
  s.activeLandBattle.battle.phase='finished';s.activeLandBattle.battle.winner=winner==='england'?'england':a.defender;
  const done=finishLandBattle(s);
  assert.equal(done.civilians.some(u=>u.id==='local'),winner!=='england');
 }
});
