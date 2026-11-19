import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {battleExperience} from '../army-experience.mjs';
import {battleResult} from '../battle-result.mjs';
const reference=JSON.parse(readFileSync(new URL('./native-army-experience.json',import.meta.url)));
test('fought battle awards match 54 original executable captures',()=>{
 for(const c of reference.cases)assert.equal(battleExperience(c.experience,c.hp,c.won),c.result,JSON.stringify(c));
 for(const bad of [-1,401,NaN,1.5])assert.throws(()=>battleExperience(bad,100,true),/experience/);
});
test('serialized battle result keeps casualty health and awards campaign experience once',()=>{
 const b={phase:'finished',province:'p',attacker:'england',defender:'france',winner:'england',units:[
 {id:'winner',type:'pikeman',side:0,hp:28,experience:65,medals:0,tile:30,state:0},
 {id:'reserve',type:'pikeman',side:0,hp:100,experience:380,medals:3,tile:null,state:0},
 {id:'escape',type:'pikeman',side:1,hp:1,experience:80,medals:0,tile:null,state:2,escaped:true},
 {id:'dead',type:'pikeman',side:1,hp:0,experience:80,medals:0,tile:null,state:3}]};
 const saved=JSON.stringify(b),r=battleResult(JSON.parse(saved));
 assert.deepEqual(r.armies.england.survivors.map(u=>[u.id,u.hp,u.experience]),[['winner',28,100],['reserve',100,400]]);
 assert.deepEqual(r.armies.france.survivors.map(u=>[u.id,u.hp,u.experience]),[['escape',1,100]]);
 assert.equal(r.armies.france.losses.length,1);
 assert.deepEqual(battleResult(b),r,'reopening result must not award additional experience');
 assert.equal(JSON.stringify(b),saved,'result extraction does not mutate battle');
});
import {experienceMedals} from '../army-experience.mjs';
import {createBattle,deploymentLimit} from '../battle.mjs';
import {terrainDamage} from '../tactical.mjs';
test('campaign medal conversion matches all 401 original legal values',()=>{
 const native=JSON.parse(readFileSync(new URL('./native-army-medals.json',import.meta.url)));
 for(const c of native.cases)assert.equal(experienceMedals(c.experience),c.medals);
});
test('campaign experience controls tactical strength and general deployment allowance',()=>{
 const forces={england:[{id:'g',owner:'england',type:'general',hp:100,experience:300,medals:0},{id:'p',owner:'england',type:'pikeman',hp:100,experience:99}],france:[{id:'f',owner:'france',type:'pikeman',hp:100,experience:100}]};
 const b=createBattle({province:'p',attacker:'england',defender:'france',forces,nations:{england:{known:[]},france:{known:[]}},activeWidth:29,cells:Array.from({length:464},()=>({terrain:0}))});
 assert.equal(b.limits[0],13);assert.equal(deploymentLimit({known:['95']},forces.england),15);
 assert.equal(b.units[0].medals,3,'stale cached medals never override campaign experience');
 assert.equal(b.units[1].medals,0);assert.equal(b.units[2].medals,1);
 b.phase='finished';b.winner='england';const r=battleResult(JSON.parse(JSON.stringify(b)));
 assert.equal(r.armies.england.survivors[1].experience,134);
 assert.equal(r.armies.england.survivors[1].medals,1);
 const nextForces={england:r.armies.england.survivors.map(u=>({...u,owner:'england'})),france:r.armies.france.survivors.map(u=>({...u,owner:'france'}))};
 const next=createBattle({province:'q',attacker:'england',defender:'france',forces:nextForces,nations:{england:{known:[]},france:{known:[]}},activeWidth:29,cells:Array.from({length:464},()=>({terrain:0}))});
 assert.equal(next.units[1].medals,1,'earned medal survives result-to-next-battle transition');
 const before=terrainDamage(b.units[1],b.units[2],{melee:true,attackerTerrain:0,defenderTerrain:0});
 const after=terrainDamage(next.units[1],next.units[2],{melee:true,attackerTerrain:0,defenderTerrain:0});
 assert.ok(after.physicalLoss>before.physicalLoss,'medal increases actual melee damage');
});
