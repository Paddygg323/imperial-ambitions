import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {settleMerchantBattleCargo} from '../merchant-battle-cargo.mjs';
import {deliverTrade} from '../trade.mjs';
function fixture(){const s=createGame();s.tradeDeliveries=[{seller:'portugal',buyer:'england',good:'lumber',quantity:8,unitPrice:40}];return s;}
test('positive native cargo report loses full shipment and credits only the captured share',()=>{
 let s=fixture(),cargo=s.tradeDeliveries[0];const before=structuredClone(s.nations);let draws=0;
 const result=settleMerchantBattleCargo(s,cargo,{raider:'france',initialCargo:6,survivingCargo:1},()=>{draws++;return 5;});
 assert.deepEqual(result,{reportedLost:8,captured:4,outcome:'lost'});assert.equal(draws,8);
 assert.equal(s.nations.france.stock.lumber,before.france.stock.lumber+4);
 assert.equal(s.nations.portugal.cash,before.portugal.cash-320);assert.equal(s.nations.england.cash,before.england.cash);
 assert.throws(()=>settleMerchantBattleCargo(s,cargo,{raider:'france',initialCargo:6,survivingCargo:1},()=>{throw Error('Repeated RNG');}),/no longer pending/);
 s=loadGame(saveGame(s));deliverTrade(s,'england',[]);assert.equal(s.nations.england.stock.lumber,before.england.stock.lumber);
});
test('zero cargo report preserves pending delivery even with no surviving capacity, as native does',()=>{
 for(const remaining of [0,6]){const s=fixture(),cargo=s.tradeDeliveries[0],before=structuredClone(s.nations);const result=settleMerchantBattleCargo(s,cargo,{raider:'france',initialCargo:6,survivingCargo:remaining},()=>5);
 assert.equal(result.outcome,'okay');assert.deepEqual(s.nations,before);assert.equal(s.tradeDeliveries.length,1);deliverTrade(s,'england',[]);assert.equal(s.nations.england.stock.lumber,before.england.stock.lumber+8);}
});
test('large shipment native branch and privateering award remain distinct from warehouse loss',()=>{
 const s=fixture(),cargo=s.tradeDeliveries[0];cargo.quantity=60;s.nations.france.known.push('54');const before=s.nations.france.stock.lumber;
 const result=settleMerchantBattleCargo(s,cargo,{raider:'france',initialCargo:6,survivingCargo:3},()=>{throw Error('Large branch must not draw');});
 assert.deepEqual(result,{reportedLost:30,captured:19,outcome:'lost'});assert.equal(s.nations.france.stock.lumber,before+19);assert.equal(s.tradeDeliveries.length,0);
});

test('checkpoint orchestration does not settle a battle loss twice or check the second port',async()=>{
 const {checkTradeShipments}=await import('../merchant-routes.mjs');const s=fixture(),cash=s.nations.portugal.cash;let calls=0;
 checkTradeShipments(s,cargo=>{calls++;return settleMerchantBattleCargo(s,cargo,{raider:'france',initialCargo:6,survivingCargo:1},()=>5).outcome;});
 assert.equal(calls,1);assert.equal(s.nations.portugal.cash,cash-320);assert.deepEqual(s.tradeDeliveries,[]);
});
