import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,beginTurn,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {openMarket,nextOffer,acceptOffer,setTradeOrder,deliverTrade,settleTradeInterception} from '../trade.mjs';
import {tradeCheckpoints} from '../merchant-routes.mjs';
function fixture(){
 const s=createGame();for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
 const m=Object.values(s.minors).find(m=>s.provinces.some(p=>p.old&&p.owner===m.id));s.minors={[m.id]:m};
 m.cash=1000;m.marketTurn=s.turn;m.budgets={fabric:500};setTradeOrder(s,'england',{good:'fabric',quantity:2});return {s,m};
}
test('minor purchases are bounded, paid and carried by the selling Great Power',()=>{
 const {s,m}=fixture(),market=openMarket(s),cargo=market.cargo.england,before=s.nations.england.cash;
 const price=nextOffer(s,market).price;assert.equal(nextOffer(s,market).buyer,m.id);acceptOffer(s,market,m.id,2);
 assert.equal(m.cash,1000-2*price);assert.equal(m.budgets.fabric,500-2*price);assert.equal(s.nations.england.cash,before+2*price);assert.equal(market.cargo.england,cargo-2);
 assert.equal(m.stock.fabric,0);assert.equal(market.inTransit[0].carrier,'england');
 s.tradeDeliveries=market.inTransit;const loaded=loadGame(saveGame(s));deliverTrade(loaded,m.id,[]);
 assert.equal(loaded.minors[m.id].stock.fabric,2);assert.equal(loaded.tradeDeliveries.length,0);
});
test('minor cancellation returns funds and goods and uses both countries checkpoints',()=>{
 const {s,m}=fixture(),market=openMarket(s),goods=s.nations.england.stock.fabric,cash=s.nations.england.cash;
 acceptOffer(s,market,m.id,2);s.tradeDeliveries=market.inTransit;
 const shipment=s.tradeDeliveries[0];assert.deepEqual(tradeCheckpoints(s,shipment).map(p=>p.nation),['england',m.id]);
 settleTradeInterception(s,shipment,'canc');assert.equal(s.nations.england.stock.fabric,goods);assert.equal(s.nations.england.cash,cash);assert.equal(m.cash,1000);assert.equal(s.tradeDeliveries.length,0);
});
test('minor budgets and seller cargo constrain offers independently of treasury',()=>{
 const {s,m}=fixture();m.budgets.fabric=250;const market=openMarket(s);assert.equal(nextOffer(s,market).maximum,1);
 market.cargo.england=0;assert.equal(nextOffer(s,market),null);
});
test('campaign settles real minor purchases and subsidies once per market turn',()=>{
 let s=createGame();
 // Leave cloth available to minor buyers instead of letting a Great Power's
 // opening shortage consume the entire offer before they participate.
 for(const n of Object.values(s.nations))n.stock.fabric=100;
 s.nations.england.orders.trade={bids:[],offers:{fabric:4}};
 s=beginTurn(s);assert.ok(s.market.complete);const cash=Object.values(s.minors).map(m=>m.cash);
 s=beginTurn(loadGame(saveGame(s)));assert.deepEqual(Object.values(s.minors).map(m=>m.cash),cash);
 assert.ok(s.market.deals.some(d=>s.minors[d.buyer]),'minor buyers participate in the live market');
 s=resolveTurn(s);assert.equal(s.tradeDeliveries.length,0);assert.ok(Object.values(s.minors).some(m=>Object.values(m.stock).some(q=>q>0)));
});

test('undiscovered tribes do not buy and invalid minor finances cannot be saved',()=>{
 const s=createGame();for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
 const tribe=Object.values(s.minors).find(m=>s.provinces.some(p=>p.owner===m.id&&!p.old));
 s.minors={[tribe.id]:tribe};tribe.marketTurn=s.turn;tribe.budgets={fabric:500};setTradeOrder(s,'england',{good:'fabric',quantity:2});
 assert.equal(nextOffer(s,openMarket(s)),null);
 const t=s.tiles.find(t=>t.owner===tribe.id);s.nations.england.revealed.push(t.id);
 assert.equal(nextOffer(s,openMarket(s)).buyer,tribe.id);
 tribe.cash=-1;assert.throws(()=>saveGame(s),/Invalid minor/);
});
