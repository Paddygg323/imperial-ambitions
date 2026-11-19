import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {transport} from '../economy.mjs';
import {openMarket,nextOffer,acceptOffer,setTradeOrder} from '../trade.mjs';
import {portSeas,revealCoast} from '../overseas.mjs';
import {tradeCheckpoints} from '../merchant-routes.mjs';

test('generated tribal crops reach an English warehouse and manufacture on the following turn',()=>{
 let s=createGame();const seller='kwakiutl',good='sugarCane';
 // Isolate market competition, not geography, development, cargo or production.
 for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
 s.nations.england.stock.sugarCane=0;
 if(!s.nations.england.known.includes('13'))s.nations.england.known.push('13');
 setTradeOrder(s,'england',{good,bid:true});
 const network=transport(s,seller);assert.equal(network.incoming[good],2);
 const capital=s.minors[seller].capital,sea=portSeas(s,capital)[0];assert.ok(sea);
 let market=openMarket(s);assert.equal(nextOffer(s,market),null,'Unknown tribes cannot supply offers');
 revealCoast(s,'england',sea);market=openMarket(s);
 let offer;while((offer=nextOffer(s,market))&&offer.seller!==seller)acceptOffer(s,market,offer.buyer,0);
 assert.ok(offer);assert.equal(offer.good,good);assert.equal(offer.maximum,2);
 const buyerCash=s.nations.england.cash,sellerCash=s.minors[seller].cash,cargo=market.cargo.england;
 acceptOffer(s,market,'england',2);assert.equal(market.cargo.england,cargo-2);
 assert.equal(s.nations.england.cash,buyerCash-2*offer.price);assert.equal(s.minors[seller].cash,sellerCash+2*offer.price);
 assert.equal(s.nations.england.stock[good],0,'Payment does not deliver the goods');
 assert.equal(s.minors[seller].exportStock[good],0);
 for(const checkpoint of tradeCheckpoints(s,market.inTransit[0]))assert.ok(s.seas.zones.some(z=>z.id===checkpoint.sea));
 while((offer=nextOffer(s,market)))acceptOffer(s,market,offer.buyer,0);
 s.market=market;s=loadGame(saveGame(s));assert.equal(s.market.inTransit[0].quantity,2);
 s=resolveTurn(s);assert.equal(s.nations.england.stock[good],2);assert.equal(s.tradeDeliveries.length,0);
 assert.ok(s.reports.some(r=>r.nation==='england'&&r.kind==='tradeDelivery'&&r.seller===seller&&r.quantity===2));
 s=command(s,'england',{type:'production',recipe:'sugar',quantity:1});
 const sugar=s.nations.england.stock.sugar;
 setTradeOrder(s,'england',{good,bid:false});s.market=openMarket(s);
 while((offer=nextOffer(s,s.market)))acceptOffer(s,s.market,offer.buyer,0);
 s=resolveTurn(loadGame(saveGame(s)));
 assert.equal(s.nations.england.stock[good],0);assert.equal(s.nations.england.stock.sugar,sugar+1);
 assert.ok(s.reports.some(r=>r.nation==='england'&&r.kind==='production'&&r.recipe==='sugar'&&r.made===1));
});

test('undeveloped generated crops cannot become minor export offers',()=>{
 const s=createGame(),seller='kwakiutl';
 for(const t of s.tiles)if(t.owner===seller&&t.resource==='sugarCane')t.level=0;
 assert.equal(transport(s,seller).incoming.sugarCane,0);
 const market=openMarket(s);assert.equal(s.minors[seller].exportStock.sugarCane,0);
 assert.ok(!market.offers.some(o=>o.seller===seller&&o.good==='sugarCane'));
});
