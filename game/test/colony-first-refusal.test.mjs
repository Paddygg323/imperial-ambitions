import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {colonyFirstRefusal} from '../colony-first-refusal.mjs';
import {openMarket,nextOffer,acceptOffer,TRADE_GOODS} from '../trade.mjs';
const offer=(seller,buyer,good='timber')=>({seller,good,buyers:[buyer]});
test('first refusal changes only colony slots, preserving rivals and unrelated trade',()=>{
 const rows=[offer('tribe','france'),offer('scotland','holland'),offer('tribe','portugal'),offer('tribe','england'),offer('tribe','france','iron')];
 const original=structuredClone(rows),out=colonyFirstRefusal(rows,{tribe:{colonyOf:'england'}});
 assert.deepEqual(out,[rows[3],rows[1],rows[0],rows[2],rows[4]]);assert.deepEqual(rows,original);
 assert.deepEqual(colonyFirstRefusal(rows,{}),rows);
});
function fixture(){
 const s=createGame({preferenceSeed:123}),id=Object.keys(s.minors).find(id=>s.provinces.some(p=>!p.old&&p.owner===id));
 for(const n of Object.values(s.nations)){n.orders.trade={bids:[],offers:{}};n.cash=5000;}
 for(const m of Object.values(s.minors)){m.marketTurn=s.turn;m.budgets={};m.exportTurn=s.turn;m.exportStock=Object.fromEntries(TRADE_GOODS.map(g=>[g,0]));}
 const m=s.minors[id];m.colonyOf='england';m.exportStock.timber=3;
 const tile=s.tiles.find(t=>t.owner===id).id;
 for(const country of ['england','france']){s.nations[country].revealed.push(tile);s.nations[country].orders.trade.bids=['timber'];}
 // Give France a better ordinary score to ensure this exercises first refusal.
 s.relations.england[id]=50;s.relations.france[id]=255;
 return {s,id};
}
test('market offers parent first, reloads, and sells only the remainder to the rival',()=>{
 let {s,id}=fixture();s.market=openMarket(s);s=loadGame(saveGame(s));
 assert.equal(nextOffer(s,s.market).buyer,'england');const opening=s.nations.england.stock.timber,cash=s.nations.england.cash;
 const price=nextOffer(s,s.market).price;acceptOffer(s,s.market,'england',1);
 assert.equal(s.nations.england.cash,cash-price);assert.equal(s.nations.england.stock.timber,opening);
 const rival=nextOffer(s,s.market);assert.equal(rival.buyer,'france');assert.equal(rival.maximum,2);
 acceptOffer(s,s.market,'france',2);assert.equal(nextOffer(s,s.market),null);
 assert.equal(s.minors[id].exportStock.timber,0);assert.equal(s.market.inTransit.reduce((n,c)=>n+c.quantity,0),3);
});
test('parent refusal or lack of cargo releases goods; no parent bid does not reserve them',()=>{
 for(const mode of ['refuse','cargo','noBid','boycott']){
  const {s,id}=fixture();if(mode==='noBid')s.nations.england.orders.trade.bids=[];
  if(mode==='boycott')s.nations.england.tradePolicies={[id]:300};
  const market=openMarket(s);if(mode==='cargo')market.cargo.england=0;
  if(mode==='refuse'){assert.equal(nextOffer(s,market).buyer,'england');acceptOffer(s,market,'england',0);}
  assert.equal(nextOffer(s,market).buyer,'france',mode);assert.equal(nextOffer(s,market).maximum,3,mode);
 }
});

