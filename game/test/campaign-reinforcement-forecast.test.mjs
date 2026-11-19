import test from 'node:test';import assert from 'node:assert/strict';
import {createGame} from '../engine.mjs';import {campaignReinforcementForecast} from '../campaign-reinforcement-forecast.mjs';import {setTransportLink} from '../transport-links.mjs';
const planning=()=>({undeveloped:Array(28).fill(0),unused:Array(28).fill(0)});
function fixture(){const s=createGame();s.nations.england.capital='10,10';s.transportLinks={};s.ships=[];s.armies=[];
 const tile=(x,resource=null,level=0)=>({id:`${x},10`,x,y:10,owner:'england',province:'home',resource,level,prospected:true,port:false});
 s.tiles=[{...tile(10),port:true},tile(11),tile(12,'grain',4)];s.provinces=[{id:'home',owner:'england',old:true}];
 Object.assign(s.nations.england.stock,{grain:30,meat:30,fish:0,fabric:10,bronze:40,steel:100,lumber:100});return s;}
const networks=[{root:'10,10',flag:0}];
test('roads and food flow through population forecast into actual campaign reinforcement ratings',()=>{
 const s=fixture(),options={networks,planning:planning()};const before=campaignReinforcementForecast(s,'england',options);
 assert.deepEqual(before.input.needs,[2,2]);assert.equal(before.input.potential[0],0);
 setTransportLink(s,'10,10','11,10','rail');const snapshot=JSON.stringify(s),after=campaignReinforcementForecast(s,'england',options);
 assert.equal(after.input.potential[0],4);assert.ok(after.recruitmentLimit>before.recruitmentLimit);assert.ok(after.strength.armyPotential>before.strength.armyPotential);
 assert.equal(JSON.stringify(s),snapshot,'forecast cannot manufacture, feed or spend');
 Object.assign(s.nations.england.stock,{grain:0,fish:0,meat:0});assert.equal(campaignReinforcementForecast(s,'england',options).recruitmentLimit,0);
});
test('food planning counts ships and regiments, preserves native food indices, and requires minister inputs',()=>{
 const s=fixture();s.ships=[{owner:'england',type:'carrack'},{owner:'france',type:'carrack'}];s.armies=[{owner:'england',type:'pikeman'}];
 const p=planning();p.undeveloped[20]=3;p.undeveloped[22]=4;p.undeveloped[21]=99;p.unused[20]=1;
 const result=campaignReinforcementForecast(s,'england',{networks,planning:p});
 assert.equal(result.input.population,6);assert.deepEqual(result.input.needs,[3,3]);assert.deepEqual(result.input.undeveloped,[3,4]);assert.deepEqual(result.input.available,[30,0,30]);
 delete s.nations.england.interiorPlanning;
 assert.throws(()=>campaignReinforcementForecast(s,'england',{networks}),/Interior planning totals required/);
});
