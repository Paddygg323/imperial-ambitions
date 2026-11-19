import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,beginTurn,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {setTradeOrder,openMarket,nextOffer,acceptOffer,INITIAL_PRICES} from '../trade.mjs';
function fixture(){const s=createGame();s.minors={};for(const n of Object.values(s.nations)){n.orders.trade={bids:[],offers:{}};n.cash=5000;}return s;}
test('three commodity bids, six after Trade Fairs; food is never bought',()=>{
 const s=fixture();for(const good of ['iron','timber','wool'])setTradeOrder(s,'england',{good,bid:true});
 assert.throws(()=>setTradeOrder(s,'england',{good:'grain',bid:true}),/not traded/);
 assert.throws(()=>setTradeOrder(s,'england',{good:'copper',bid:true}),/Trade Fairs/);
 assert.equal(s.nations.england.orders.trade.bids.length,3,'rejected order must not alter bids');
});
test('turn pauses for human offers, survives save/load, and completes only once',()=>{
 let s=fixture();s.nations.france.stock.fabric=30;s.relations.england.france=200;
 s=command(s,'england',{type:'tradeOrder',good:'fabric',bid:true});s=beginTurn(s);
 assert.equal(s.year,1500);assert.equal(nextOffer(s,s.market).buyer,'england');
 assert.throws(()=>resolveTurn(s),/Review/);
 assert.throws(()=>command(s,'england',{type:'recruitWorker',quantity:1}),/Finish/);
 s=loadGame(saveGame(s));const before=s.nations.england.stock.fabric;
 s=command(s,'england',{type:'tradeAccept',quantity:1,stop:true});assert.equal(s.nations.england.stock.fabric,before);assert.equal(s.market.inTransit[0].quantity,1);
 assert.ok(s.market.complete);s=resolveTurn(s);assert.equal(s.year,1502);assert.equal(s.turn,1);assert.equal(s.market,undefined);assert.equal(s.nations.england.stock.fabric,before+1);assert.deepEqual(s.tradeDeliveries,[]);
 assert.ok(s.reports.some(r=>r.kind==='trade'&&r.buyer==='england'&&r.quantity===1));
});
test('no offers means no purchases or fabricated supply',()=>{
 const s=fixture();setTradeOrder(s,'england',{good:'iron',bid:true});const m=openMarket(s);
 assert.equal(nextOffer(s,m),null);assert.equal(m.deals.length,0);
});
test('actual trade conserves goods and money and consumes buyer cargo only',()=>{
 const s=fixture();setTradeOrder(s,'england',{good:'fabric',quantity:2});setTradeOrder(s,'portugal',{good:'fabric',bid:true});
 const m=openMarket(s),before={cash:s.nations.england.cash+s.nations.portugal.cash,goods:s.nations.england.stock.fabric+s.nations.portugal.stock.fabric,cargo:m.cargo.portugal,sellerCargo:m.cargo.england};
 assert.equal(nextOffer(s,m).maximum,2);acceptOffer(s,m,'portugal',2);
 assert.equal(s.nations.england.cash,5000+2*m.inTransit[0].unitPrice);assert.equal(s.nations.portugal.cash,5000-2*m.inTransit[0].unitPrice);
 assert.equal(s.nations.england.cash+s.nations.portugal.cash,before.cash);
 assert.equal(s.nations.england.stock.fabric+s.nations.portugal.stock.fabric+m.inTransit.reduce((sum,c)=>sum+c.quantity,0),before.goods);
 assert.equal(m.cargo.portugal,before.cargo-2);assert.equal(m.cargo.england,before.sellerCargo);
});
test('partial acceptance passes the remainder to the next preferred bidder',()=>{
 const s=fixture();s.relations.portugal.england=200;s.relations.france.england=90;setTradeOrder(s,'england',{good:'fabric',quantity:3});
 for(const id of ['portugal','france'])setTradeOrder(s,id,{good:'fabric',bid:true});
 const m=openMarket(s);assert.equal(nextOffer(s,m).buyer,'portugal');acceptOffer(s,m,'portugal',1);
 assert.equal(nextOffer(s,m).buyer,'france');assert.equal(nextOffer(s,m).quantity,2);
 acceptOffer(s,m,'france',2);assert.equal(m.deals.length,2);assert.equal(nextOffer(s,m),null);
});
test('cash plus credit and cargo prevent impossible deals, including selling manufactured reservations',()=>{
 const s=fixture();s.nations.portugal.cash=0;setTradeOrder(s,'england',{good:'fabric',quantity:2});setTradeOrder(s,'portugal',{good:'fabric',bid:true});
 assert.equal(nextOffer(s,openMarket(s)),null);
 s.nations.england.stock.wool=4; // All four units are reserved by two fabric orders.
 s.nations.england.orders.production.woolFabric=2;
 assert.throws(()=>setTradeOrder(s,'england',{good:'wool',quantity:1}),/reserved/);
 assert.equal(INITIAL_PRICES.iron,100);assert.equal(INITIAL_PRICES.horses,250);
});


test('saved transit cargo rejects invalid quantities and countries',()=>{
 const s=fixture();
 for(const cargo of [{buyer:'england',seller:'france',good:'timber',quantity:-1},{buyer:'missing',seller:'france',good:'timber',quantity:1}]){
  s.tradeDeliveries=[cargo];assert.throws(()=>saveGame(s),/Invalid trade cargo/);
 }
 delete s.tradeDeliveries;s.market={inTransit:[{buyer:'england',seller:'france',good:'fictional',quantity:2}]};
 assert.throws(()=>saveGame(s),/Invalid trade cargo/);
});
