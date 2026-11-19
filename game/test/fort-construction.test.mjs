import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {fortConstruction} from '../fort-construction.mjs';
import {campaignBattlefield} from '../battle-map.mjs';
import {createBattle} from '../battle.mjs';
const build=s=>command(s,'england',{type:'civilian',unit:s.civilians.find(c=>c.owner==='england'&&c.type==='engineer').id,job:'fort',tile:s.nations.england.capital});
test('fort costs and research gates match manual and native construction table',()=>{
 assert.deepEqual(fortConstruction({known:[]},0),{level:1,goods:{lumber:3,bronze:3},turns:2});
 assert.throws(()=>fortConstruction({known:[]},1),/Mine Engineering/);
 assert.deepEqual(fortConstruction({known:['7']},1).goods,{lumber:4,bronze:4});
 assert.throws(()=>fortConstruction({known:['7']},2),/Modern Fortifications/);
 assert.deepEqual(fortConstruction({known:['68']},2).goods,{lumber:5,steel:5});
 assert.throws(()=>fortConstruction({known:['68']},3),/maximum/);
});
test('fort takes two turns, survives reload and supplies actual automatic battle guns',()=>{
 let s=createGame(),n=s.nations.england,p=s.provinces.find(p=>p.town===n.capital);p.fort=0;
 s=build(s);assert.equal(s.nations.england.stock.bronze,1);s=resolveTurn(s);assert.equal(s.provinces.find(q=>q.id===p.id).fort,0);
 s=resolveTurn(loadGame(saveGame(s)));const level=s.provinces.find(q=>q.id===p.id).fort;assert.equal(level,1);
 const forces={france:[{id:'a',owner:'france',type:'pikeman',hp:100,experience:0}],england:[]};
 const map=campaignBattlefield(forces,s.nations.england,level);
 const b=createBattle({province:p.id,attacker:'france',defender:'england',forces,nations:s.nations,...map,seed:1,fortLevel:level});
 assert.equal(b.units.filter(u=>u.emplaced).length,1);
});
test('fort requires engineer in town and reserves the construction against duplication',()=>{
 const s=createGame();s.nations.england.known=['7'];const engineer=s.civilians.find(c=>c.owner==='england'&&c.type==='engineer');
 engineer.tile=s.tiles.find(t=>t.owner==='england'&&t.id!==s.nations.england.capital).id;
 assert.throws(()=>build(s),/Deploy/);engineer.tile=s.nations.england.capital;
 const started=build(s);started.civilians.push({...engineer,id:'second',order:null});
 assert.throws(()=>command(started,'england',{type:'civilian',unit:'second',job:'fort',tile:engineer.tile}),/Another Engineer/);
});
