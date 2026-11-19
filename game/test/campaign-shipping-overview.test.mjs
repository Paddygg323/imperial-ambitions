import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {conquerProvince} from '../conquest.mjs';
import {campaignShippingOverview} from '../campaign-shipping-overview.mjs';
import {campaignDomesticDelivery} from '../campaign-domestic-delivery.mjs';

function scenario(){
 const s=createGame(),n=s.nations.england,remote=s.nations.france.capital;
 conquerProvince(s,s.tiles.find(t=>t.id===remote).province,'england');
 for(const tile of s.tiles)tile.level=0;
 for(const [root,level] of [[n.capital,2],[remote,4]]){const tile=s.tiles.find(t=>t.id===root);tile.resource='grain';tile.level=level;tile.prospected=true;}
 for(const good in n.stock)n.stock[good]=0;
 n.transportAssignments[remote].assigned[20]=2;
 return {s,remote};
}
test('port delivery totals match receipt while tile provenance shows connected production separately',()=>{
 const {s,remote}=scenario(),before=JSON.stringify(s),view=campaignShippingOverview(s,'england');
 assert.equal(JSON.stringify(s),before);
 assert.equal(view.incoming.grain,4);
 const port=view.ports.find(p=>p.root===remote).goods.find(g=>g.good==='grain');
 assert.deepEqual(port,{good:'grain',connected:4,assigned:2,incoming:2});
 const contribution=view.contributions.find(r=>r.root===remote&&r.good==='grain');
 assert.equal(contribution.quantity,4);assert.equal(contribution.tile,remote);
 assert.equal(Object.hasOwn(contribution,'delivered'),false);
 const receipt=campaignDomesticDelivery(loadGame(saveGame(s)),'england',{currentEvents:[]});
 for(const good of ['grain','fish','meat','timber'])assert.equal(view.incoming[good],receipt.nation.stock[good]);
 assert.equal(view.cargoUsed,2);
});
test('preview reconciles changed production exactly as receipt without rewriting orders',()=>{
 const {s,remote}=scenario();s.nations.england.transportAssignments[remote].assigned[20]=4;
 s.tiles.find(t=>t.id===remote).level=1;
 const view=campaignShippingOverview(s,'england'),receipt=campaignDomesticDelivery(s,'england',{currentEvents:[]});
 assert.equal(view.incoming.grain,3);assert.equal(receipt.nation.stock.grain,3);
 assert.equal(view.cargoUsed,1);assert.equal(receipt.nation.transportAssignments[remote].assigned[20],1);
 assert.equal(s.nations.england.transportAssignments[remote].assigned[20],4);
 for(const port of view.ports)for(const g of port.goods){
  const credited=view.contributions.filter(r=>r.root===port.root&&r.good===g.good).reduce((sum,r)=>sum+r.quantity,0);
  assert.equal(credited,g.connected);
 }
});
