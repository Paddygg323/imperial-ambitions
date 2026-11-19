import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {minorStartingArmy} from '../starting-minor-armies.mjs';import {ARMY} from '../rules.mjs';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {provinceAdjacency} from '../world.mjs';import {stageLandAttacks} from '../land-attack.mjs';import {startLandBattle} from '../campaign-battle.mjs';
test('minor and tribal garrisons match96 original executions and consume the same supplied draws',()=>{
 const {cases}=JSON.parse(readFileSync(new URL('../../outputs/Native-minor-garrisons-audit.json',import.meta.url)));assert.equal(cases.length,96);
 for(const c of cases){let i=0;const types=minorStartingArmy({old:c.owner<12,capital:c.capital,strength:c.rawDifficulty,random:()=>c.draws[i++]});
  assert.deepEqual(types.map(t=>ARMY[t].nativeId),c.regiments.map(r=>r.nativeType),JSON.stringify(c));assert.equal(i,c.draws.length);
 }
});
test('all independent provinces start defended and survive save/load without duplicating forces',()=>{
 const s=createGame(),loaded=loadGame(saveGame(s));assert.deepEqual(loaded.armies,s.armies);
 for(const p of s.provinces.filter(p=>s.minors[p.owner])){
  const units=s.armies.filter(u=>u.province===p.id&&u.owner===p.owner),capital=p.town===s.minors[p.owner].capital;
  assert.ok(units.every(u=>u.hp===100&&u.experience===0&&u.defending));
  if(p.old)assert.equal(units.length,capital?6:2);else assert.ok(units.length>=(capital?4:2)&&units.length<=(capital?8:4));
 }
});
test('an attack on an initial independent garrison opens a battle instead of free occupation',()=>{
 let s=createGame();const adj=provinceAdjacency(s),source=s.provinces.find(p=>p.owner==='england'&&[...adj[p.id]].some(id=>s.minors[s.provinces.find(p=>p.id===id).owner]));
 const target=s.provinces.find(p=>s.minors[p.owner]&&adj[source.id].has(p.id));s.wars=[['england',target.owner]];
 const unit=s.armies.find(u=>u.owner==='england');unit.province=source.id;unit.order={job:'attack',province:target.id};
 const before=s.armies.filter(u=>u.owner===target.owner&&u.province===target.id).length;
 stageLandAttacks(s);assert.equal(s.pendingLandAttacks[0].defenders.length,before);
 s=startLandBattle(loadGame(saveGame(s)));assert.ok(s.activeLandBattle);assert.equal(s.provinces.find(p=>p.id===target.id).owner,target.owner);
});
