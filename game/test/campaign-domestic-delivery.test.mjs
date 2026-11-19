import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';import {setTransportLink} from '../transport-links.mjs';
import {campaignDomesticDelivery} from '../campaign-domestic-delivery.mjs';
import {NATIVE_GOODS} from '../resource-categories.mjs';
function fixture(){
 const s=createGame();s.nations.england.capital='10,10';s.transportLinks={};s.ships=[];
 const tile=(x,y,resource=null,level=0,province='home')=>({id:`${x},${y}`,x,y,province,owner:'england',terrain:1,resource,level,prospected:true,port:false});
 s.tiles=[tile(10,10),tile(11,10),tile(12,10,'grain',4),{...tile(30,30,null,0,'remote'),port:true},tile(31,30,'meat',2,'remote')];s.provinces=[{id:'home',old:true},{id:'remote',old:false}];
 s.nations.england.stock=Object.fromEntries(NATIVE_GOODS.map(g=>[g,0]));
 const networks=[{root:'10,10',flag:0,automatic:true,assigned:Array(28).fill(0)},{root:'30,30',flag:0,automatic:false,assigned:Array(28).fill(0)}];networks[1].assigned[22]=4;
 return {s,networks};
}
test('campaign map roads and current resource levels determine reconciled food receipts',()=>{
 const {s,networks}=fixture();const before=JSON.stringify(s);
 let result=campaignDomesticDelivery(s,'england',{networks,currentEvents:[]});
 assert.equal(result.nation.stock.grain,0);assert.equal(result.nation.stock.meat,2);assert.equal(result.cargoUsed,2);assert.equal(JSON.stringify(s),before);
 setTransportLink(s,'10,10','11,10','rail');s.nations.england.materialDebt={grain:1};
 result=campaignDomesticDelivery(s,'england',{networks,currentEvents:[]});assert.equal(result.nation.stock.grain,3);assert.equal(result.nation.materialDebt.grain,0);
 result=campaignDomesticDelivery(s,'england',{networks,currentEvents:[{kind:8,nation:1,detail:3}]});assert.equal(result.nation.stock.grain,2);assert.equal(result.nation.stock.meat,2);
 s.tiles.find(t=>t.id==='11,10').owner='france';result=campaignDomesticDelivery(s,'england',{networks,currentEvents:[]});assert.equal(result.nation.stock.grain,0);
});
test('invalid saved allocation cannot partly alter campaign stock or caller networks',()=>{
 const {s,networks}=fixture();networks[1].assigned[22]=-1;const before=JSON.stringify({s,networks});
 assert.throws(()=>campaignDomesticDelivery(s,'england',{networks,currentEvents:[]}));assert.equal(JSON.stringify({s,networks}),before);
});

test('receipt adapter reads persisted campaign assignments and returns reloadable replacement state',()=>{
 let s=loadGame(saveGame(createGame()));const before=JSON.stringify(s);
 const result=campaignDomesticDelivery(s,'england',{currentEvents:[]});
 assert.equal(JSON.stringify(s),before);
 assert.deepEqual(result.nation.transportRoots,result.networks.map(r=>r.root));
 for(const r of result.networks)assert.deepEqual(result.nation.transportAssignments[r.root],{automatic:r.automatic,assigned:r.assigned});
 s.nations.england=result.nation;s=loadGame(saveGame(s));
 assert.deepEqual(s.nations.england.transportAssignments,result.nation.transportAssignments);
 delete s.nations.england.transportAssignments;
 assert.throws(()=>campaignDomesticDelivery(s,'england',{currentEvents:[]}),/Persisted shipping assignments/);
});
