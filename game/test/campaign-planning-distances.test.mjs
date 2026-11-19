import test from 'node:test';import assert from 'node:assert/strict';import {createGame} from '../engine.mjs';import {campaignTransportPotential} from '../campaign-transport-potential.mjs';import {campaignPlanningDistances} from '../campaign-planning-distances.mjs';import {campaignResourcePlanning} from '../campaign-resource-planning.mjs';import {setTransportLink} from '../transport-links.mjs';
test('live road networks feed weighted planning distances and resource opportunities',()=>{
 const s=createGame();s.nations.england.capital='10,10';s.transportLinks={};
 const tile=x=>({id:`${x},10`,x,y:10,province:'home',owner:'england',terrain:0,level:0,prospected:true});
 s.tiles=Array.from({length:7},(_,i)=>tile(10+i));s.tiles[0].port=true;s.tiles[3].resource='grain';s.tiles[3].terrain=4;s.tiles[2].terrain=8;s.provinces=[{id:'home',owner:'england',old:true}];
 const networks=[{root:'10,10',flag:0}];let transport=campaignTransportPotential(s,'england',{networks});const before=JSON.stringify(s);
 let distances=campaignPlanningDistances(s,'england',{transport});assert.equal(distances['13,10'].roadDistance,6);assert.equal(distances['11,10'].portDistance,5);assert.equal(distances['12,10'].portDistance,4);assert.equal(JSON.stringify(s),before);
 setTransportLink(s,'10,10','11,10','road');transport=campaignTransportPotential(s,'england',{networks});distances=campaignPlanningDistances(s,'england',{transport});assert.equal(distances['13,10'].roadDistance,5);
 const p=campaignResourcePlanning(s,'england',{transport,entries:[{tile:'13,10',...distances['13,10']}],thresholdForGood:()=>5});assert.equal(p.unused[20],1,'coastal opportunity remains in range');
 s.tiles[2].owner='france';transport=campaignTransportPotential(s,'england',{networks});distances=campaignPlanningDistances(s,'england',{transport});assert.equal(distances['13,10'].roadDistance,0);assert.equal(distances['12,10'],undefined);
});
