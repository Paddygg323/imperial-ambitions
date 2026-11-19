import {setTradeOrder,openMarket,nextOffer,acceptOffer} from '../trade.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,finishTurnEconomy} from '../engine.mjs';import {planEconomy} from '../ai.mjs';
import {exportReserve,exportProduction} from '../ai-exports.mjs';
function fixture(){const s=createGame(),n=s.nations.france;for(const g of Object.keys(n.stock))n.stock[g]=0;n.workers=Array.from({length:6},()=>({type:'peasant',fit:true}));for(const r of Object.keys(n.orders.production))n.orders.production[r]=0;return {s,n};}

test('export forecast repays existing and new output debt without mutating the live nation',()=>{
 let {s,n}=fixture();n.stock.timber=20;n.stock.grain=100;n.stock.meat=100;
 n.workers=Array.from({length:8},(_,i)=>({id:'export-debt-'+i,type:'peasant',fit:true}));
 n.materialDebt={paper:2};n.orders.production.paper=1;
 const before=structuredClone(n),prices={paper:400,timber:100},reserve={};
 const extra=exportProduction(n,{cargo:2,prices,reserve});
 assert.deepEqual(extra,{paper:3});assert.deepEqual(n,before,'forecast must be read-only');
 s=command(s,'france',{type:'production',recipe:'paper',quantity:4});
 s=finishTurnEconomy({...s,turnPhase:'combat'});
 assert.equal(s.nations.france.materialDebt.paper,0);assert.equal(s.nations.france.stock.paper,2);
 assert.equal(s.reports.find(r=>r.nation==='france'&&r.kind==='production'&&r.recipe==='paper').made,4);
});

test('unrepayable export debt cannot generate phantom stock or unlimited production',()=>{
 const {n}=fixture();n.stock.timber=20;n.materialDebt={paper:20};
 assert.deepEqual(exportProduction(n,{cargo:2,prices:{paper:400,timber:100},reserve:{}}),{paper:3});
 assert.equal(n.materialDebt.paper,20);assert.equal(n.stock.paper,0);
});
test('export production spends idle labour only on profitable cargo-sized surplus and retains raw reserves',()=>{
 const {n}=fixture();n.stock.timber=20;n.stock.wool=20;n.stock.iron=20;
 const reserve=exportReserve(n),prices={timber:100,wool:100,iron:100,paper:400,lumber:250,fabric:250,castIron:250};
 assert.deepEqual(exportProduction(n,{cargo:2,prices,reserve}),{paper:2});
 assert.deepEqual(exportProduction(n,{cargo:0,prices,reserve}),{});
 n.stock.timber=7;n.stock.wool=6;n.stock.iron=6;
 assert.deepEqual(exportProduction(n,{cargo:2,prices,reserve}),{});
 n.stock.timber=20;n.stock.paper=5;
 assert.deepEqual(exportProduction(n,{cargo:2,prices,reserve}),{},'already has a full cargo of paper surplus');
});
test('worker luxury and missing-garrison reserves remain protected',()=>{
 const {n}=fixture();n.workers.push({type:'apprentice'},{type:'apprentice'},{type:'master'});
 const reserve=exportReserve(n,{fabric:6,lumber:6});assert.equal(reserve.sugar,4);assert.equal(reserve.hats,2);assert.equal(reserve.fabric,6);
});
test('live trade planner offers surplus paper previously excluded from AI sales',()=>{
 const s=createGame(),n=s.nations.france;s.civilians=[];s.minors={};n.stock.paper=8;
 for(const country of Object.values(s.nations))country.orders.trade={bids:[],offers:{}};
 const next=planEconomy(s,'france',command);
 assert.ok(next.nations.france.orders.trade.offers.paper>0);
 assert.ok(next.nations.france.orders.trade.offers.paper<=5);
 setTradeOrder(next,'england',{good:'paper',bid:true});
 const market=openMarket(next),offer=nextOffer(next,market);assert.equal(offer.good,'paper');
 const cash=next.nations.france.cash,stock=next.nations.france.stock.paper;
 acceptOffer(next,market,'england',1);
 assert.equal(next.nations.france.stock.paper,stock-1);assert.ok(next.nations.france.cash>cash);
 assert.equal(market.inTransit[0].good,'paper');assert.equal(market.inTransit[0].quantity,1);
});
