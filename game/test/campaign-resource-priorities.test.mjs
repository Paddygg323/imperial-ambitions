import test from 'node:test';import assert from 'node:assert/strict';
import {createGame} from '../engine.mjs';import {setTransportLink} from '../transport-links.mjs';
import {campaignResourcePriorities} from '../campaign-resource-priorities.mjs';
import {resourcePriorities} from '../resource-priorities.mjs';
function fixture(){const s=createGame();s.ships=[];s.armies=[];s.transportLinks={};const n=s.nations.england;n.capital='10,10';n.cash=0;n.finance.credit=0;
 const tile=(x,resource=null,level=0)=>({id:`${x},10`,x,y:10,owner:'england',province:'home',resource,terrain:0,level,prospected:true,port:false});
 s.tiles=[{...tile(10),port:true},tile(11),tile(12,'grain',4)];s.provinces=[{id:'home',owner:'england',old:true}];
 Object.assign(n.stock,{grain:30,meat:30,fish:0,timber:8});n.orders.production.lumber=1;n.lastConsumption.grain=7;
 return s;}
const options=()=>({networks:[{root:'10,10',flag:0}],planning:{undeveloped:Array(28).fill(0),unused:Array(28).fill(0)},demand:Array(28).fill(1),previous:Array(28).fill(1)});
test('campaign priorities compose actual consumption, reserved stocks, connected supply and research without mutation',()=>{
 const s=fixture(),o=options();let r=campaignResourcePriorities(s,'england',o);
 assert.equal(r.input.stock[1],8);assert.equal(r.input.reserved[1],2);assert.equal(r.input.consumed[20],7);assert.equal(r.input.potential[20],0);assert.equal(r.input.manufacturingEtas[7],99);
 setTransportLink(s,'10,10','11,10','rail');const before=JSON.stringify(s);r=campaignResourcePriorities(s,'england',o);
 assert.equal(r.input.potential[20],4);assert.deepEqual(r.priorities,resourcePriorities(r.input));assert.equal(JSON.stringify(s),before);
 s.nations.england.known.push('13','23');r=campaignResourcePriorities(s,'england',o);assert.equal(r.input.manufacturingEtas[7],0);assert.equal(r.input.workerEtas[7],0);
});
test('treasury changes riches preference while preserving industrial output and physical supply',()=>{
 const s=fixture(),o=options(),before=campaignResourcePriorities(s,'england',o);s.nations.england.cash=88000;const after=campaignResourcePriorities(s,'england',o);
 assert.ok(after.priorities[25]<before.priorities[25]);assert.equal(after.input.gdp,before.input.gdp);assert.deepEqual(after.input.potential,before.input.potential);
});
test('campaign priorities refuse unknown legacy history or missing demand/planning/previous inputs',()=>{
 const s=fixture(),o=options();assert.throws(()=>campaignResourcePriorities(s,'england',{...o,demand:undefined}),/Demand and prior/);
 assert.throws(()=>campaignResourcePriorities(s,'england',{...o,previous:undefined}),/Demand and prior/);
 delete s.nations.england.interiorPlanning;
 assert.throws(()=>campaignResourcePriorities(s,'england',{...o,planning:undefined}),/Interior planning/);
 delete s.nations.england.lastConsumption;assert.throws(()=>campaignResourcePriorities(s,'england',o),/Observed consumption/);
});
