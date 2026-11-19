import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {diplomaticDealPrice} from '../deal-prices.mjs';
test('diplomatic prices match original executable captures',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-deal-price-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,440);
 for(const c of audit.cases)assert.equal(diplomaticDealPrice({...c,war:c.status==='war',buyerSubject:c.status==='buyerSubject',sellerSubject:c.status==='sellerSubject'}),c.price,JSON.stringify(c));
});
test('war blocks preferential prices; subject prices precede policy restrictions',()=>{
 assert.equal(diplomaticDealPrice({world:100,alternative:80,sellerSubject:true}),80);
 assert.equal(diplomaticDealPrice({world:100,alternative:80,buyerSubject:true}),100);
 assert.equal(diplomaticDealPrice({world:100,alternative:80,sellerSubject:true,policy:300}),80);
 assert.equal(diplomaticDealPrice({world:100,alternative:80,buyerSubject:true,war:true}),-1);
 assert.throws(()=>diplomaticDealPrice({world:NaN}),/Invalid/);
});

test('live subsidies change paid prices, conserve cash and survive reload',async()=>{
 const {createGame,command,saveGame,loadGame}=await import('../engine.mjs');
 const {setTradeOrder,openMarket,nextOffer,acceptOffer}=await import('../trade.mjs');
 let s=createGame();s.minors={};for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
 s=command(s,'england',{type:'tradePolicy',target:'portugal',policy:75});
 s=loadGame(saveGame(s));assert.equal(s.nations.england.tradePolicies.portugal,75);
 setTradeOrder(s,'england',{good:'fabric',quantity:2});setTradeOrder(s,'portugal',{good:'fabric',bid:true});
 const m=openMarket(s);s.market=m;
 const offer=nextOffer(s,m);assert.equal(offer.price,Math.trunc(s.prices.fabric*.75));
 const before=s.nations.england.cash+s.nations.portugal.cash, buyer=s.nations.portugal.cash;
 s=loadGame(saveGame(s));acceptOffer(s,s.market,'portugal',1);
 assert.equal(s.nations.portugal.cash,buyer-offer.price);
 assert.equal(s.nations.england.cash+s.nations.portugal.cash,before);
 assert.equal(s.market.inTransit[0].unitPrice,offer.price);
 assert.equal(s.market.deals[0].total,offer.price);
});
test('boycotts block both trade directions and invalid policies are rejected',async()=>{
 const {createGame,command,saveGame}=await import('../engine.mjs');
 const {setTradeOrder,openMarket,nextOffer}=await import('../trade.mjs');
 for(const [seller,buyer] of [['england','portugal'],['portugal','england']]){
  let s=createGame();s.minors={};for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
  assert.throws(()=>command(s,'england',{type:'tradePolicy',target:'england',policy:75}),/known country/);
  assert.throws(()=>command(s,'england',{type:'tradePolicy',target:'portugal',policy:1}),/Invalid/);
  s=command(s,'england',{type:'tradePolicy',target:'portugal',policy:300});
  setTradeOrder(s,seller,{good:'fabric',quantity:1});setTradeOrder(s,buyer,{good:'fabric',bid:true});
  assert.equal(nextOffer(s,openMarket(s)),null);
  s.nations.england.tradePolicies.portugal=0;assert.throws(()=>saveGame(s),/trade policies/);
 }
});

test('minor export subsidy increases the price actually paid by the Great Power',async()=>{
 const {createGame,command}=await import('../engine.mjs');const {nextOffer,acceptOffer}=await import('../trade.mjs');
 let s=createGame();const minor=Object.values(s.minors).find(n=>s.provinces.some(p=>p.owner===n.id&&p.old));assert.ok(minor);
 s=command(s,'england',{type:'tradePolicy',target:minor.id,policy:75});
 s.minors[minor.id].exportStock={timber:2};
 const m={offers:[{seller:minor.id,good:'timber',quantity:2,price:101,buyers:['england'],buyerIndex:0}],index:0,cargo:{england:2},deals:[],inTransit:[],stopped:{}};
 const before=s.nations.england.cash+s.minors[minor.id].cash;
 assert.equal(nextOffer(s,m).price,126);acceptOffer(s,m,'england',1);
 assert.equal(s.nations.england.cash+s.minors[minor.id].cash,before);
 assert.equal(m.inTransit[0].unitPrice,126);assert.equal(m.cargo.england,1);assert.equal(s.minors[minor.id].exportStock.timber,1);
});
