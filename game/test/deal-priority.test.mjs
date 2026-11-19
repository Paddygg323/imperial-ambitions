import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compareTradeDeals,orderTradeDeals} from '../deal-priority.mjs';
test('deal comparison matches400original raw/material/relation/price/tie cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-deal-priority-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,400);
 for(const c of audit.cases)assert.equal(compareTradeDeals(c.left,c.right,c.turn),c.result,JSON.stringify(c));
});
test('insertion ranks raw buyers and material sellers in their distinct directions',()=>{
 const base={buyer:1,seller:0,quantity:2,relation:128,price:100,good:0};
 const expensive={...base,buyer:2,price:125};
 assert.deepEqual(orderTradeDeals([base,expensive],0),[expensive,base]);
 const material={...base,good:11},discount={...material,seller:2,price:75};
 assert.deepEqual(orderTradeDeals([material,discount],0),[discount,material]);
 const friendly={...material,seller:3,relation:200};
 assert.deepEqual(orderTradeDeals([material,friendly],0),[friendly,material]);
});

test('live material offers compete across sellers by adjusted price',async()=>{
 const {createGame,command}=await import('../engine.mjs');const {setTradeOrder,openMarket,nextOffer}=await import('../trade.mjs');
 let s=createGame();s.minors={};for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
 s=command(s,'england',{type:'tradePolicy',target:'portugal',policy:75});
 for(const seller of ['france','england'])setTradeOrder(s,seller,{good:'fabric',quantity:2});
 setTradeOrder(s,'portugal',{good:'fabric',bid:true});
 assert.equal(nextOffer(s,openMarket(s)).seller,'england');
});
test('global queue shares offered quantity across buyers and preserves it on reload',async()=>{
 const {createGame,saveGame,loadGame}=await import('../engine.mjs');const {setTradeOrder,openMarket,nextOffer,acceptOffer}=await import('../trade.mjs');
 let s=createGame();s.minors={};for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
 s.nations.england.stock.fabric=20;setTradeOrder(s,'england',{good:'fabric',quantity:2});
 for(const id of ['france','portugal','holland'])setTradeOrder(s,id,{good:'fabric',bid:true});
 s.market=openMarket(s);const first=nextOffer(s,s.market);acceptOffer(s,s.market,first.buyer,1);
 assert.ok(s.market.offers.every(o=>o.quantity===1));
 const pending=nextOffer(s,s.market);s=loadGame(saveGame(s));assert.deepEqual(nextOffer(s,s.market),pending);
 acceptOffer(s,s.market,pending.buyer,1);assert.equal(nextOffer(s,s.market),null);
 assert.equal(s.nations.england.stock.fabric,18);assert.equal(s.market.deals.reduce((n,d)=>n+d.quantity,0),2);
});
