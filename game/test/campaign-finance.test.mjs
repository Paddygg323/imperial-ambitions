import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
import {openMarket,setTradeOrder,acceptOffer,nextOffer} from '../trade.mjs';
test('real purchases borrow only up to available credit and persist debt',()=>{
 let s=createGame();s.minors={};s.nations.portugal.cash=100;setTradeOrder(s,'england',{good:'fabric',quantity:2});setTradeOrder(s,'portugal',{good:'fabric',bid:true});
 const m=openMarket(s);assert.equal(nextOffer(s,m).maximum,1);const paid=nextOffer(s,m).price;acceptOffer(s,m,'portugal',1);assert.equal(s.nations.portugal.cash,100-paid);
 s=loadGame(saveGame(s));assert.equal(s.nations.portugal.cash,100-paid);assert.equal(s.nations.portugal.finance.credit,20000);
});
test('end-turn debt charges interest, liquidates stocks and eventually ends insolvent player game',()=>{
 let s=createGame();s.minors={};const n=s.nations.england;n.cash=-1000;n.finance.stage=4;for(const g in n.stock)n.stock[g]=0;n.stock.fabric=1;for(const t of s.tiles)t.level=0;
 s.turnPhase='combat';s=finishTurnEconomy(s);
 assert.equal(s.nations.england.stock.fabric,0);assert.equal(s.nations.england.finance.stage,5);assert.equal(s.nations.england.finance.interest,122);assert.equal(s.nations.england.cash,-1060);
 assert.ok(s.reports.some(r=>r.nation==='england'&&r.kind==='finance'&&r.receipts===62));
 s=loadGame(saveGame(s));s.turnPhase='combat';s=finishTurnEconomy(s);assert.equal(s.outcome.reason,'bankruptcy');assert.equal(s.nations.england.alive,false);
 assert.ok(s.provinces.filter(p=>p.owner==='england').every(p=>p.anarchy));assert.throws(()=>command(s,'england',{type:'recruitWorker',quantity:1}),/cannot issue/);
 assert.equal(loadGame(saveGame(s)).outcome.reason,'bankruptcy');
});
test('invalid financial fields are rejected on save',()=>{
 for(const patch of [{credit:-1},{rate:NaN},{stage:0.5},{interest:Infinity}]){const s=createGame();Object.assign(s.nations.england.finance,patch);assert.throws(()=>saveGame(s),/Invalid finance/);}
});
