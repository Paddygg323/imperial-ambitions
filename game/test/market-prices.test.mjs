import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nextMarketPrice,tallyMarketOrders} from '../market-prices.mjs';
test('price changes match288native cases including missing sellers, fractional demand and bounds',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-market-price-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,288);
 for(const c of audit.cases)assert.equal(nextMarketPrice(c.previous,{demandDelta:c.delta,material:c.material,sellers:c.sellers}),c.price,JSON.stringify(c));
});

test('supply tally matches180native year, quantity, request and inactive-country cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-market-tally-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,180);
 for(const c of audit.cases){
  const actual=tallyMarketOrders(c.orders.filter((_,i)=>!c.inactive.includes(i)),c.turn);
  for(const key of ['requests','offers','quantity'])assert.equal(actual[key],c[key],`${c.turn} ${key}`);
  assert.ok(Math.abs(actual.adjustedOffers-c.adjustedOffers)<1e-12,JSON.stringify(c));
 }
});

test('minor tally matches270native offer limits and distinct year weighting cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-minor-market-tally-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,270);
 for(const c of audit.cases){
  const actual=tallyMarketOrders(c.orders,c.turn,{minor:true,available:c.orders.map(()=>c.limit)});
  for(const key of ['requests','offers','quantity'])assert.equal(actual[key],c[key],`${c.turn} ${key}`);
  assert.ok(Math.abs(actual.adjustedOffers-c.adjustedOffers)<1e-11,JSON.stringify(c));
 }
});

test('live market updates once per turn and preserves offered prices through save/reload',async()=>{
 const {createGame,saveGame,loadGame}=await import('../engine.mjs');const {openMarket,setTradeOrder}=await import('../trade.mjs');
 const s=createGame();s.minors={};for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
 setTradeOrder(s,'england',{good:'fabric',quantity:2});setTradeOrder(s,'portugal',{good:'fabric',bid:true});
 const market=openMarket(s);assert.equal(s.prices.fabric,249);assert.equal(market.offers.find(o=>o.good==='fabric').price,249);
 const prices=structuredClone(s.prices);s.market=market;
 const loaded=loadGame(saveGame(s));assert.deepEqual(loaded.market,market);openMarket(loaded);assert.deepEqual(loaded.prices,prices);
 delete loaded.market;loaded.turn++;openMarket(loaded);assert.equal(loaded.marketPriceTurn,loaded.turn);assert.ok(loaded.prices.fabric<249);
 loaded.prices.fabric=-1;assert.throws(()=>saveGame(loaded),/market prices/);
});
test('discovery affects raw-price average without treating horses as a discovery',async()=>{
 const {marketRawAvailable,calculateMarketPrices}=await import('../market-prices.mjs');const {TECHS}=await import('../rules.mjs');const {INITIAL_PRICES}=await import('../trade.mjs');
 assert.deepEqual(marketRawAvailable([],TECHS),[true,true,true,true,true,false,false,false,false,false]);
 assert.deepEqual(marketRawAvailable(['29','5','0','1','2'],TECHS),Array(10).fill(true));
 const powers=Array.from({length:3},()=>({timber:-1}));
 const prices=calculateMarketPrices(INITIAL_PRICES,{turn:0,powers,minors:[],rawAvailable:marketRawAvailable([],TECHS)});
 assert.equal(prices.timber,102);assert.equal(prices.iron,100);assert.equal(prices.horses,250);
});
