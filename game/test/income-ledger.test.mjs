import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,beginTurn,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
import {openMarket,setTradeOrder,acceptOffer,settleTradeInterception} from '../trade.mjs';
import {deliver} from '../economy.mjs';

test('actual sales, cancellation and riches deliveries persist as income rather than cash changes',()=>{
 let s=createGame();s.minors={};setTradeOrder(s,'england',{good:'fabric',quantity:2});setTradeOrder(s,'portugal',{good:'fabric',bid:true});
 const market=openMarket(s);acceptOffer(s,market,'portugal',2);s.tradeDeliveries=market.inTransit;
 assert.deepEqual(s.nations.england.income,{sales:2*market.inTransit[0].unitPrice,riches:0,overseasProfits:0});assert.equal(s.nations.portugal.income,undefined);
 s=loadGame(saveGame(s));settleTradeInterception(s,s.tradeDeliveries[0],'canc');assert.equal(s.nations.england.income.sales,0);
 deliver(s.nations.england,{incoming:{gold:2,lumber:3},rows:[]},[]);assert.equal(s.nations.england.income.riches,400);assert.equal(s.nations.england.income.sales,0);
 s=loadGame(saveGame(s));assert.equal(s.nations.england.income.riches,400);
 s.nations.england.income.sales=NaN;assert.throws(()=>saveGame(s),/Invalid income ledger/);
});
test('turn entry resets current receipts once, market continuation preserves them and completion archives them',()=>{
 let s=createGame();s.minors={};s.nations.england.income={sales:700,riches:0,overseasProfits:0};
 s=beginTurn(s);assert.equal(s.nations.england.income.sales,0);
 s.nations.england.income.sales=25;s=beginTurn(loadGame(saveGame(s)));assert.equal(s.nations.england.income.sales,25);
 delete s.market;s.turnPhase='combat';s=finishTurnEconomy(s);assert.deepEqual(s.nations.england.lastIncome,{sales:25,riches:0,overseasProfits:0});
 assert.deepEqual(loadGame(saveGame(s)).nations.england.lastIncome,s.nations.england.lastIncome);
});
