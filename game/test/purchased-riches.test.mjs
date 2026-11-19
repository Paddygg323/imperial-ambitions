import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame,transport} from '../engine.mjs';
import {openMarket,nextOffer,acceptOffer,deliverTrade,settleTradeInterception} from '../trade.mjs';
import {settleMerchantBattleCargo} from '../merchant-battle-cargo.mjs';
function fixture(relation=127){
 const s=createGame();for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
 const row=transport(s,'scotland').rows.find(r=>r.good==='timber'&&r.delivered>0),t=s.tiles.find(t=>t.id===row.tile);
 t.resource='gold';t.level=2;t.prospected=true;t.purchasedBy='england';
 s.relations.england.scotland=relation;s.nations.england.cash=20000;
 s.market=openMarket(s);return s;
}
function purchase(s){const offer=nextOffer(s,s.market);assert.equal(offer.good,'gold');assert.equal(offer.buyer,'england');acceptOffer(s,s.market,'england',1);s.tradeDeliveries=s.market.inTransit;s.market.inTransit=[];return offer;}
test('purchased riches offer without bids; pay, reserve cargo, deliver cash once after reload',()=>{
 let s=fixture(),cash=s.nations.england.cash,cargo=s.market.cargo.england,minor=s.minors.scotland.cash;
 const o=purchase(s);assert.equal(o.price,101);assert.equal(s.nations.england.cash,cash-101);
 assert.equal(s.minors.scotland.cash,minor+101);assert.equal(s.market.cargo.england,cargo-1);
 assert.equal(s.market.deals[0].overseasProfits.length,0);
 s=loadGame(saveGame(s));deliverTrade(s,'england',[]);
 assert.equal(s.nations.england.cash,cash-101+200);assert.equal(s.nations.england.income.riches,200);assert.equal(s.nations.england.stock.gold,0);
 deliverTrade(s,'england',[]);assert.equal(s.nations.england.cash,cash-101+200);
});
test('zero price riches still require cargo and can be accepted without cash',()=>{
 const s=fixture(255);s.nations.england.cash=0;assert.equal(nextOffer(s,s.market).price,0);
 purchase(s);assert.equal(s.nations.england.cash,0);
 const empty=fixture(255);empty.market.cargo.england=0;assert.equal(nextOffer(empty,empty.market),null);
});
test('riches cancellation refunds payment; lost shipment converts neither stock nor buyer cash',()=>{
 for(const outcome of ['canc','lost']){
  const s=fixture(),cash=s.nations.england.cash,minor=s.minors.scotland.cash;purchase(s);
  settleTradeInterception(s,s.tradeDeliveries[0],outcome);deliverTrade(s,'england',[]);
  assert.equal(s.nations.england.cash,cash-(outcome==='lost'?101:0));assert.equal(s.minors.scotland.cash,minor);
  assert.equal(s.nations.england.stock.gold,0);
 }
});
test('captured purchased riches convert to raider cash rather than warehouse gold',()=>{
 const s=fixture();purchase(s);const cargo=s.tradeDeliveries[0],before=s.nations.france.cash;
 cargo.quantity=8;const result=settleMerchantBattleCargo(s,cargo,{raider:'france',initialCargo:6,survivingCargo:1},()=>5);
 assert.equal(result.outcome,'lost');assert.equal(s.nations.france.cash,before+result.captured*200);
 assert.equal(s.nations.france.stock.gold,0);assert.equal(s.tradeDeliveries.length,0);
});
