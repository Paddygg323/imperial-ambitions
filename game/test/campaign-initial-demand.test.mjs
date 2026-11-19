import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {forecastCivilians,campaignInitialDemand} from '../campaign-initial-demand.mjs';
test('forecast counts working and waiting civilians but excludes sleep and other nations',()=>{
 const s=createGame();s.civilians=[
  {id:'a',owner:'england',type:'engineer',sleep:false,order:{job:'road'}},
  {id:'b',owner:'england',type:'builder',sleep:true,order:null},
  {id:'c',owner:'england',type:'builder',sleep:false,order:{job:'wait'}},
  {id:'d',owner:'portugal',type:'railBuilder',sleep:false}];
 assert.deepEqual(forecastCivilians(s,'england'),[{nativeType:1,status:0},{nativeType:2,status:2},{nativeType:2,status:0}]);
 const before=structuredClone(s),result=campaignInitialDemand(s,'england');
 before.nations.england.cityForecast=structuredClone(s.nations.england.cityForecast);assert.deepEqual(s,before);
 const awake=result.demand[12];s.civilians[2].sleep=true;
 assert.ok(campaignInitialDemand(s,'england').demand[12]<awake);
});
test('initial campaign demand retains research and city history across reload',()=>{
 let s=createGame();s.nations.england.known.push('59','68');
 s.nations.england.cityForecast.needs[13]=8;s.nations.england.cityForecast.deductions[13]=1;
 const first=campaignInitialDemand(s,'england');assert.equal(first.input.militaryLevel,33);assert.equal(first.input.fortificationLevel,2);assert.equal(first.input.needs[13],7);
 s=loadGame(saveGame(s));const second=campaignInitialDemand(s,'england');assert.equal(second.input.needs[13],6);
});
