import test from 'node:test';import assert from 'node:assert/strict';
import {createGame} from '../engine.mjs';import {campaignTransportPotential} from '../campaign-transport-potential.mjs';import {transport} from '../economy.mjs';import {setTransportLink} from '../transport-links.mjs';
function fixture(){const s=createGame();s.nations.england.capital='10,10';s.transportLinks={};s.ships=[];
 const tile=(x,y,resource=null,level=0,province='home')=>({id:`${x},${y}`,x,y,province,owner:'england',terrain:1,resource,level,prospected:true,port:false});
 s.tiles=[tile(10,10),tile(11,10),tile(12,10,'grain',4),{...tile(30,30,null,0,'remote'),port:true},tile(31,30,'meat',2,'remote')];s.provinces=[{id:'home',old:true},{id:'remote',old:false}];return s;}
const networks=[{root:'10,10',flag:0},{root:'30,30',flag:0}];
test('live roads connect food potential while overseas cargo remains a separate delivery constraint',()=>{
 const s=fixture();const before=campaignTransportPotential(s,'england',{networks});assert.equal(before.potential.grain,0);assert.equal(before.connections['12,10'].capacity,0);assert.equal(before.potential.meat,2);assert.equal(transport(s,'england').incoming.meat,0);
 setTransportLink(s,'10,10','11,10','road');const connected=campaignTransportPotential(s,'england',{networks});assert.equal(connected.potential.grain,1);assert.deepEqual(connected.connections['12,10'],{capacity:1,via:'11,10'});
 setTransportLink(s,'10,10','11,10','rail');assert.equal(campaignTransportPotential(s,'england',{networks}).potential.grain,4);
 s.tiles.find(t=>t.id==='11,10').owner='france';assert.equal(campaignTransportPotential(s,'england',{networks}).potential.grain,0);
});
test('towns use province output and forecasts do not spend stocks or guess network history',()=>{
 const s=fixture();s.tiles[1].townLevel=1;s.tiles[1].province='town';s.tiles.push({id:'60,30',x:60,y:30,owner:'england',province:'town',resource:'timber',level:4,prospected:true});s.provinces.push({id:'town'});
 const before=JSON.stringify(s);assert.equal(campaignTransportPotential(s,'england',{networks}).potential.lumber,1);assert.equal(JSON.stringify(s),before);
 assert.throws(()=>campaignTransportPotential(s,'england'),/recorded transport/);
 assert.throws(()=>campaignTransportPotential(s,'england',{networks:[{root:'12,10',flag:0}]}),/Invalid transport network root/);
});
