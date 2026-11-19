import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {relationAfterTrade,recordTradeRelation} from '../trade-relations.mjs';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {setTradeOrder,openMarket,nextOffer,acceptOffer} from '../trade.mjs';
test('trade relation gain matches72 native office, country and boundary cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-trade-relations-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,72);
 for(const c of audit.cases){assert.equal(relationAfterTrade(c.relation,c.office),c.forward);assert.equal(c.forward,c.reverse);}
});
test('accepted deals improve reciprocal relations once, declined deals and reload do not',()=>{
 let s=createGame();s.minors={};for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
 setTradeOrder(s,'england',{good:'fabric',quantity:2});setTradeOrder(s,'portugal',{good:'fabric',bid:true});s.market=openMarket(s);
 acceptOffer(s,s.market,'portugal',2);assert.equal(s.relations.portugal.england,91);assert.equal(s.relations.england.portugal,91);
 s=loadGame(saveGame(s));assert.equal(s.relations.portugal.england,91);nextOffer(s,s.market);assert.equal(s.relations.portugal.england,91);
 s.turn++;delete s.market;s.market=openMarket(s);const offer=nextOffer(s,s.market);assert.ok(offer);acceptOffer(s,s.market,offer.buyer,0);assert.equal(s.relations.portugal.england,91);
});
test('minor trade requires an established office in either trade direction',()=>{
 const s=createGame();const minor=Object.keys(s.minors)[0];
 for(const [buyer,seller] of [['england',minor],[minor,'england']]){
  recordTradeRelation(s,buyer,seller);assert.equal(s.relations[buyer][seller],90);
 }
 s.nations.england.consulates=[minor];recordTradeRelation(s,'england',minor);assert.equal(s.relations[minor].england,91);
 recordTradeRelation(s,minor,'england');assert.equal(s.relations.england[minor],92);
 s.relations.england[minor]=255;recordTradeRelation(s,'england',minor);assert.equal(s.relations[minor].england,255);
});
