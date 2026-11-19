import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {refreshCityForecast} from '../city-forecast-state.mjs';
test('recorded city needs initialize independently and persist successive native-style queries',()=>{
 let s=createGame();const n=s.nations.england;
 assert.deepEqual(n.cityForecast,{needs:Array(28).fill(0),deductions:Array(28).fill(0)});
 s.ships=[];s.armies=[];
 n.workers=[{id:'p',type:'peasant',fit:true},{id:'a',type:'apprentice',fit:false},{id:'j',type:'journeyman',fit:true}];
 n.cityForecast.needs[12]=9;n.cityForecast.deductions[12]=2;
 n.stock.grain=999;n.materialDebt={grain:42};
 let result=refreshCityForecast(s,'england');
 assert.equal(result[20],2);assert.equal(result[22],1);assert.equal(result[17],1);assert.equal(result[18],1);assert.equal(result[12],7);
 result[12]=999;assert.equal(n.cityForecast.needs[12],7,'returned copy does not alias saved state');
 s=loadGame(saveGame(s));assert.equal(s.nations.england.cityForecast.needs[12],7);
 result=refreshCityForecast(s,'england');assert.equal(result[12],5);
 assert.equal(s.nations.england.stock.grain,999);assert.equal(s.nations.england.materialDebt.grain,42);
 assert.equal(s.nations.france.cityForecast.needs[12],0);
});
test('legacy forecast history stays unknown and malformed arrays fail save validation',()=>{
 let s=createGame();delete s.nations.england.cityForecast;s=loadGame(saveGame(s));
 assert.throws(()=>refreshCityForecast(s,'england'),/Recorded city forecast/);
 s.nations.england.cityForecast={needs:[0],deductions:Array(28).fill(0)};
 assert.throws(()=>saveGame(s),/city forecast state/);
});
