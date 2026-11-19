import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {tradeCheckpoints,checkTradeShipments} from '../merchant-routes.mjs';
import {portSeas} from '../overseas.mjs';
import {deliverTrade} from '../trade.mjs';
function fixture(){const s=createGame();s.tradeDeliveries=[{seller:'portugal',buyer:'england',good:'lumber',quantity:3,unitPrice:40}];return s;}
test('trade checks source then destination ports, not an invented full ocean route',()=>{
 const s=fixture(),cargo=s.tradeDeliveries[0],points=tradeCheckpoints(s,cargo);
 assert.deepEqual(points.map(p=>p.nation),['portugal','england']);
 for(const p of points){assert.equal(p.port,s.nations[p.nation].capital);assert.equal(p.sea,portSeas(s,p.port)[0]);}
 const calls=[];checkTradeShipments(s,(c,p)=>{assert.equal(c,cargo);calls.push(p);return 'okay';});assert.deepEqual(calls,points);assert.equal(s.tradeDeliveries.length,1);
 const before=s.nations.england.stock.lumber;deliverTrade(s,'england',[]);assert.equal(s.nations.england.stock.lumber,before+3);assert.equal(s.tradeDeliveries.length,0);
});
test('interception at either endpoint settles once, survives reload and cannot later deliver',()=>{
 for(const outcome of ['lost','canc'])for(const endpoint of [0,1]){
  let s=fixture();const before=structuredClone(s.nations);let calls=0;
  checkTradeShipments(s,()=>calls++===endpoint?outcome:'okay');assert.equal(calls,endpoint+1);
  assert.equal(s.nations.portugal.cash,before.portugal.cash-120);
  assert.equal(s.nations.england.cash,before.england.cash+(outcome==='canc'?120:0));
  assert.equal(s.nations.portugal.stock.lumber,before.portugal.stock.lumber+(outcome==='canc'?3:0));
  s=loadGame(saveGame(s));checkTradeShipments(s,()=>{throw Error('Shipment checked twice');});deliverTrade(s,'england',[]);
  assert.equal(s.nations.england.stock.lumber,before.england.stock.lumber);assert.deepEqual(s.tradeDeliveries,[]);
 }
});

test('failed shipment changes carrying nation support once across endpoints, settlement and reload',async()=>{
 const {warSupportEvent}=await import('../war-support.mjs');
 for(const outcome of ['lost','canc'])for(const endpoint of [0,1]){
  let s=fixture();s.nations.england.ministers={foreign:0,defence:2};s.nations.england.warSupport=.5;s.nations.portugal.warSupport=.5;
  let calls=0;checkTradeShipments(s,()=>calls++===endpoint?outcome:'okay');
  const expected=warSupportEvent(.5,2,8);assert.equal(s.nations.england.warSupport,expected);assert.equal(s.nations.portugal.warSupport,.5);
  s=loadGame(saveGame(s));checkTradeShipments(s,()=>{throw Error('already settled');});assert.equal(s.nations.england.warSupport,expected);
 }
});
test('minor-country imports penalize the Great Power seller carrying the cargo',()=>{
 const s=createGame(),minor=Object.keys(s.minors)[0];s.nations.france.warSupport=.5;
 s.tradeDeliveries=[{seller:'france',buyer:minor,carrier:'france',good:'lumber',quantity:1,unitPrice:40}];
 checkTradeShipments(s,()=> 'lost');assert.equal(s.nations.france.warSupport,Math.fround(.5+Math.fround(-.01)));
});
