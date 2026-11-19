import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame,transport} from '../engine.mjs';
import {openMarket,setTradeOrder,nextOffer,acceptOffer} from '../trade.mjs';
import {foreignDevelopment} from '../foreign-development.mjs';
function fixture(owner){
 const s=createGame();for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
 for(const t of s.tiles.filter(t=>t.owner==='scotland'&&t.resource==='timber'))t.purchasedBy=owner;
 assert.ok(transport(s,'scotland').incoming.timber>0);
 s.relations.scotland[owner]=255;s.relations[owner].scotland=255;s.nations.england.cash=20000;
 setTradeOrder(s,'england',{good:'timber',bid:true});s.market=openMarket(s);
 let offer=nextOffer(s,s.market);while(offer&&(offer.seller!=='scotland'||offer.good!=='timber')){acceptOffer(s,s.market,'england',0);offer=nextOffer(s,s.market);}
 assert.ok(offer);return s;
}
for(const owner of ['france','england'])test('foreign production pays '+(owner==='england'?'self-purchase refund':'third-party owner')+' once across reload',()=>{
 let s=loadGame(saveGame(fixture(owner)));const offer=nextOffer(s,s.market),before=s.nations[owner].cash,minor=s.minors.scotland.cash;
 acceptOffer(s,s.market,'england',1);
 assert.equal(s.nations[owner].cash,before+(owner==='england'?0:offer.price));
 assert.equal(s.nations[owner].income.overseasProfits,offer.price);
 assert.equal(s.minors.scotland.cash,minor+offer.price,'original pays the minor the full sale receipt');
 assert.equal(s.market.inTransit.filter(c=>c.seller==='scotland'&&c.good==='timber').length,1);
 const paid=s.market.deals.at(-1);assert.equal(paid.overseasProfits[0].amount,offer.price);
 s=loadGame(saveGame(s));const cash=s.nations[owner].cash,ledger=s.nations[owner].income.overseasProfits;
 nextOffer(s,s.market);assert.equal(s.nations[owner].cash,cash);assert.equal(s.nations[owner].income.overseasProfits,ledger);
 assert.ok(!s.market.offers.slice(s.market.index).some(o=>o.seller==='scotland'&&o.good==='timber'&&o.buyers.includes('england')),'accepted buyer does not reappear after reload');
});
test('foreign contributions use delivered quantities and ignore unconnected purchased land',()=>{
 const s=createGame(),t=s.tiles.find(t=>t.owner==='scotland'&&t.resource==='timber');t.purchasedBy='england';
 assert.deepEqual(foreignDevelopment(s,[{tile:t.id,good:'timber',produced:4,delivered:0}]),{});
 assert.deepEqual(foreignDevelopment(s,[{tile:t.id,good:'timber',produced:4,delivered:2}]),{england:{timber:2}});
});
