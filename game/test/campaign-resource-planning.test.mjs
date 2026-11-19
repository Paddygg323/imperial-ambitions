import test from 'node:test';import assert from 'node:assert/strict';
import {createGame} from '../engine.mjs';import {campaignTransportPotential} from '../campaign-transport-potential.mjs';import {campaignResourcePlanning} from '../campaign-resource-planning.mjs';import {campaignReinforcementForecast} from '../campaign-reinforcement-forecast.mjs';import {setTransportLink} from '../transport-links.mjs';
function fixture(){const s=createGame();s.nations.england.capital='10,10';s.nations.england.known=['8','9','11'];s.transportLinks={};
 const tile=(x,resource=null,terrain=0)=>({id:`${x},10`,x,y:10,owner:'england',province:'home',resource,terrain,level:0,prospected:true});
 s.tiles=[{...tile(10),port:true},tile(11),tile(12,'grain',4),tile(15,'timber',14),tile(16,'sugarCane',15)];s.provinces=[{id:'home',old:true,owner:'england'}];return s;}
const networks=[{root:'10,10',flag:0}],thresholdForGood=()=>12;
test('campaign planning joins road capacity and research without inventing eligible tile or distance inputs',()=>{
 const s=fixture(),entries=[{tile:'12,10',roadDistance:2,portDistance:0}];
 let transport=campaignTransportPotential(s,'england',{networks});let p=campaignResourcePlanning(s,'england',{transport,entries,thresholdForGood});
 assert.equal(p.unused[20],1);assert.equal(p.undeveloped[20],0);
 setTransportLink(s,'10,10','11,10','rail');transport=campaignTransportPotential(s,'england',{networks});
 const snapshot=JSON.stringify(s);p=campaignResourcePlanning(s,'england',{transport,entries,thresholdForGood});
 assert.equal(p.unused[20],0);assert.equal(p.undeveloped[20],2);assert.equal(p.rows[0].connection,4);
 const automatic=campaignResourcePlanning(s,'england',{transport,thresholdForGood});assert.equal(automatic.rows.length,s.tiles.length);assert.equal(automatic.undeveloped[20],2);
 const forecast=campaignReinforcementForecast(s,'england',{networks,planning:p});assert.deepEqual(forecast.input.undeveloped,[2,0]);assert.equal(JSON.stringify(s),snapshot);
 s.nations.england.known.push('26');assert.equal(campaignResourcePlanning(s,'england',{transport,entries,thresholdForGood}).undeveloped[20],3);
 assert.throws(()=>campaignResourcePlanning(s,'england',{transport,entries}),/threshold required/);
});
test('scrub forest cap, unavailable crops and exact port-distance-one fishing marker are preserved',()=>{
 const s=fixture(),transport={connections:Object.fromEntries(s.tiles.map(t=>[t.id,{capacity:4}]))};
 const entries=[{tile:'15,10',roadDistance:0,portDistance:1},{tile:'16,10',roadDistance:0,portDistance:2}];
 const p=campaignResourcePlanning(s,'england',{transport,entries,thresholdForGood});
 assert.equal(p.undeveloped[1],1);assert.equal(p.undeveloped[7],0);assert.equal(p.rows[1].maximum,-1);assert.equal(p.unused[21],1);assert.equal(p.tiles[21],1);
 s.nations.england.known.push('0');assert.equal(campaignResourcePlanning(s,'england',{transport,entries,thresholdForGood}).undeveloped[7],1);
 assert.throws(()=>campaignResourcePlanning(s,'england',{transport,entries:[entries[0],entries[0]],thresholdForGood}),/Unique eligible/);
});

test('planning selects owned and purchased tiles automatically and refuses missing foreign route data',()=>{
 const s=fixture();s.tiles[4].owner='minor0';s.tiles[4].purchasedBy='england';s.nations.england.known.push('0');
 const transport={connections:Object.fromEntries(s.tiles.map(t=>[t.id,{capacity:2}]))};
 const distances=Object.fromEntries(s.tiles.map(t=>[t.id,{roadDistance:1,portDistance:0}]));
 const p=campaignResourcePlanning(s,'england',{transport,distances,thresholdForGood});assert.equal(p.rows.length,5);assert.equal(p.undeveloped[7],1);
 delete distances['16,10'];assert.throws(()=>campaignResourcePlanning(s,'england',{transport,distances,thresholdForGood}),/distance missing for 16,10/);
});

test('planning reach uses industrial output and explicit priorities, independent of cash',()=>{
 const s=fixture(),n=s.nations.england,entries=[{tile:'12,10',roadDistance:12,portDistance:0}],priorities=Array(28).fill(1);
 const transport={connections:{'12,10':{capacity:0}}};n.gdp=0;n.cash=88000;
 let p=campaignResourcePlanning(s,'england',{transport,entries,priorities});assert.equal(p.rows[0].road,false);assert.equal(p.unused[20],0);
 n.cash=0;assert.deepEqual(campaignResourcePlanning(s,'england',{transport,entries,priorities}),p);
 n.gdp=13;p=campaignResourcePlanning(s,'england',{transport,entries,priorities});assert.equal(p.rows[0].road,true);assert.equal(p.unused[20],1);
 n.gdp=0;priorities[20]=2;assert.equal(campaignResourcePlanning(s,'england',{transport,entries,priorities}).rows[0].road,true);
 assert.throws(()=>campaignResourcePlanning(s,'england',{transport,entries,priorities:[]}),/priorities and industrial/);
 delete n.gdp;assert.throws(()=>campaignResourcePlanning(s,'england',{transport,entries,priorities}),/priorities and industrial/);
});
