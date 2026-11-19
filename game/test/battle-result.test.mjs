import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle,battleCommand} from '../battle.mjs';
import {battleResult} from '../battle-result.mjs';
function finished(level){
 const b=createBattle({province:'fort',attacker:'england',defender:'france',forces:{england:[{id:'a',owner:'england',type:'pikeman',hp:100}],france:[{id:'d',owner:'france',type:'pikeman',hp:100}]},nations:{england:{known:[]},france:{known:[]}},activeWidth:29,fortLevel:level,cells:Array.from({length:464},()=>({terrain:0}))});
 b.phase='finished';b.winner='france';return b;
}
test('only losing every active emplacement reduces a fort, regardless of winner',()=>{
 for(const level of [1,2,3])for(const winner of ['england','france']){
  const b=finished(level);b.winner=winner;b.fortification.segments.fill(0);
  assert.equal(battleResult(b).fortAfter,level,'wall breaches alone do not downgrade');
  const guns=b.units.filter(u=>u.emplaced);for(const gun of guns)gun.state=3;
  guns[0].state=0;assert.equal(battleResult(b).fortAfter,level,'one standing gun preserves fort level');
  guns[0].state=1;const snapshot=structuredClone(b),r=battleResult(JSON.parse(JSON.stringify(b)));
  assert.equal(r.fortAfter,level-1);assert.equal(r.fortReduced,true);assert.equal(r.winner,winner);assert.deepEqual(b,snapshot);
 }
 assert.equal(battleResult(finished(0)).fortAfter,0);
});
test('battle result preserves reserve and escaped health and distinguishes surrendered losses',()=>{
 const b=finished(1);const reserve=b.units[0];reserve.hp=73;
 b.units.push({...reserve,id:'escaped',hp:34,state:2,escaped:true}, {...reserve,id:'lost',hp:0,state:3}, {...reserve,id:'captured',hp:0,state:3,surrendered:true});
 const r=battleResult(b).armies.england;
 assert.deepEqual(r.survivors.map(u=>[u.id,u.hp,u.disposition]),[['a',73,'reserve'],['escaped',34,'escaped']]);
 assert.deepEqual(r.losses.map(u=>[u.id,u.disposition]),[['lost','destroyed'],['captured','surrendered']]);
 assert.equal(battleResult(b).armies.france.survivors.length,1,'fort guns never become campaign regiments');
});
test('ongoing battles and incomplete fort rosters cannot yield campaign damage',()=>{
 const b=finished(2);b.phase='combat';assert.throws(()=>battleResult(b),/not finished/);
 b.phase='finished';b.units=b.units.filter(u=>!u.emplaced);assert.throws(()=>battleResult(b),/complete emplacement roster/);
});
test('an attacker retreat still reports permanent damage to a neutralized fort',()=>{
 let b=finished(2);Object.assign(b,{phase:'combat',activeSide:0});
 for(const gun of b.units.filter(u=>u.emplaced)){gun.state=3;gun.hp=0;b.cells[gun.tile].unit=null;gun.tile=null;}
 Object.assign(b.units[0],{tile:233,moveLeft:2});b.cells[233].unit='a';b.units[1].tile=258;b.cells[258].unit='d';
 b=battleCommand(b,'england',{type:'retreat'});assert.equal(b.phase,'combat');
 b=battleCommand(b,'england',{type:'move',unit:'a',tile:232});
 b=battleCommand(b,'england',{type:'withdraw',unit:'a'});const result=battleResult(b);
 assert.equal(result.winner,'france');assert.equal(result.fortAfter,1);
});
