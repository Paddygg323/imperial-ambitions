import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {campaignShippingPlan} from '../campaign-shipping-plan.mjs';
import {campaignDomesticDelivery} from '../campaign-domestic-delivery.mjs';
import {conquerProvince} from '../conquest.mjs';
import {initialInteriorPlanning} from '../interior-planning-state.mjs';

function campaign(){
 const s=createGame({preferenceSeed:123}),n=s.nations.england;
 const remote=s.nations.france.capital;
 conquerProvince(s,s.tiles.find(t=>t.id===remote).province,'england');
 for(const t of s.tiles)t.level=0;
 const t=s.tiles.find(t=>t.id===remote);t.resource='grain';t.level=3;t.prospected=true;
 for(const g in n.stock)n.stock[g]=0;
 s.ships=s.ships.filter(u=>u.owner==='england').slice(0,1);s.ships[0].cargo=2;
 n.interiorPlanning=initialInteriorPlanning();
 return {s,remote};
}
test('real map allocation survives reload and supplies food through the country receipt adapter',()=>{
 let {s,remote}=campaign();const before=JSON.stringify(s),r=campaignShippingPlan(s,'england');
 assert.equal(JSON.stringify(s),before);assert.equal(r.input.capacity,2);
 assert.equal(r.potential.networks.find(n=>n.root===remote).quantities[20],3);
 assert.ok(r.nation.transportAssignments[remote].assigned[20]>0);
 s.nations.england=r.nation;s=loadGame(saveGame(s));
 const receipt=campaignDomesticDelivery(s,'england',{currentEvents:[]});
 assert.equal(receipt.nation.stock.grain,r.nation.transportAssignments[remote].assigned[20]);
 assert.deepEqual(s.nations.england.shippingPriorities,r.priorities);
 s.nations.england=receipt.nation;s.turn=2;
 const next=campaignShippingPlan(loadGame(saveGame(s)),'england');
 assert.equal(next.nation.shippingPriorities.length,28);
});
test('absent first-turn weights do not invent history; later missing history fails atomically',()=>{
 const {s}=campaign(),first=campaignShippingPlan(s,'england');
 s.nations.england.shippingPriorities=Array(28).fill(999);
 assert.deepEqual(campaignShippingPlan(s,'england').priorities,first.priorities);
 delete s.nations.england.shippingPriorities;s.turn=2;const before=JSON.stringify(s);
 assert.throws(()=>campaignShippingPlan(s,'england'),/priority history/);assert.equal(JSON.stringify(s),before);
 s.nations.england.shippingPriorities=Array(28).fill(NaN);assert.throws(()=>saveGame(s),/shipping priorities/);
});
test('unavailable cargo and broken resource development alter actual allocation, not warehouse stock',()=>{
 const {s,remote}=campaign();s.ships=[];
 const noCargo=campaignShippingPlan(s,'england');assert.equal(noCargo.input.capacity,0);
 assert.ok(noCargo.nation.transportAssignments[remote].assigned.every(q=>q===0));
 const original=campaign();original.s.tiles.find(t=>t.id===remote).level=0;
 assert.equal(campaignShippingPlan(original.s,'england').nation.transportAssignments[remote].assigned[20],0);
});
