import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,loadGame,saveGame} from '../engine.mjs';
import {tradeBoycott} from '../diplomacy.mjs';
import {nextOffer,acceptOffer} from '../trade.mjs';

function fixture(){
 const s=createGame();const id=Object.keys(s.minors).find(id=>s.provinces.some(p=>!p.old&&p.owner===id));
 s.minors[id].colonyOf='england';return {s,id};
}
test('colony embargoes follow separate parent flags and current parent wars in either trade direction',()=>{
 let {s,id}=fixture();s.nations.england.tradePolicies={france:300};
 assert.equal(tradeBoycott(s,id,'france'),false,'parent personal boycott is separate');
 s.nations.england.colonyBoycotts=['france'];s=loadGame(saveGame(s));
 assert.equal(tradeBoycott(s,id,'france'),true);assert.equal(tradeBoycott(s,'france',id),true);
 s.nations.england.colonyBoycotts=[];s.wars=[['england','france']];
 assert.equal(tradeBoycott(s,id,'france'),true);
 s.wars=[];assert.equal(tradeBoycott(s,id,'france'),false);
 s.nations.france.tradePolicies={[id]:300};assert.equal(tradeBoycott(s,id,'france'),true);
});
test('new colony restriction invalidates an already queued offer without spending money or cargo',()=>{
 const {s,id}=fixture();s.minors[id].exportStock={timber:2};
 const market={offers:[{seller:id,good:'timber',quantity:2,price:100,buyers:['france'],buyerIndex:0}],index:0,cargo:{france:2},deals:[],inTransit:[],stopped:{}};
 assert.ok(nextOffer(s,market));const cash=s.nations.france.cash;
 s.nations.england.colonyBoycotts=['france'];
 assert.equal(nextOffer(s,market),null);assert.throws(()=>acceptOffer(s,market,'france',1));
 assert.equal(s.nations.france.cash,cash);assert.equal(market.cargo.france,2);assert.equal(s.minors[id].exportStock.timber,2);
});
test('independent minor policies work and malformed policy saves are rejected',()=>{
 const {s,id}=fixture();delete s.minors[id].colonyOf;s.minors[id].tradePolicies={france:300};
 assert.equal(tradeBoycott(loadGame(saveGame(s)),id,'france'),true);
 s.minors[id].tradePolicies.france=13;assert.throws(()=>loadGame(saveGame(s)),/minor trade policies/);
 delete s.minors[id].tradePolicies;
 for(const flags of [['unknown'],['france','france'],'france']){
  s.nations.england.colonyBoycotts=flags;assert.throws(()=>loadGame(saveGame(s)),/colony boycotts/);
 }
});
