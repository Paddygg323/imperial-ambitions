import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame,finishTurnEconomy} from '../engine.mjs';
import {transport} from '../economy.mjs';import {openMarket} from '../trade.mjs';
import {landPurchaseQuote} from '../land-purchase.mjs';
function fixture(){
 const s=createGame(),n=s.nations.england;n.known.push('22');n.cash=20000;n.embassies=['scotland'];
 const row=transport(s,'scotland').rows.find(r=>r.good!=='fish'&&r.capacity>0);
 const t=s.tiles.find(t=>t.id===row.tile);t.resource='iron';t.terrain=8;t.level=0;t.prospected=true;
 s.civilians.push({id:'merchant-test',owner:'england',type:'merchant',tile:n.capital,order:null});
 return {s,t};
}
const buy=(s,t)=>command(s,'england',{type:'civilian',unit:'merchant-test',job:'purchase',tile:t.id});
const finish=s=>finishTurnEconomy({...s,turnPhase:'combat'});
test('purchase persists for one turn, retains sovereignty, and permits a paid builder order',()=>{
 let {s,t}=fixture();const quote=landPurchaseQuote(s,'england',t),cash=s.nations.england.cash;
 s=buy(s,t);assert.equal(s.nations.england.cash,cash-quote);assert.equal(s.tiles.find(q=>q.id===t.id).purchasedBy,undefined);
 s=finish(loadGame(saveGame(s)));t=s.tiles.find(q=>q.id===t.id);
 assert.equal(t.purchasedBy,'england');assert.equal(t.owner,'scotland');assert.equal(s.provinces.find(p=>p.id===t.province).owner,'scotland');
 const before=transport(s,'scotland').incoming.iron,builder=s.civilians.find(c=>c.owner==='england'&&c.type==='builder');
 const lumber=s.nations.england.stock.lumber,iron=s.nations.england.stock.castIron;
 s=command(s,'england',{type:'civilian',unit:builder.id,job:'develop',tile:t.id});
 assert.equal(s.nations.england.stock.lumber,lumber-1);assert.equal(s.nations.england.stock.castIron,iron-1);
 s=finish(s);assert.equal(s.tiles.find(q=>q.id===t.id).level,0);
 s=finish(loadGame(saveGame(s)));assert.equal(s.tiles.find(q=>q.id===t.id).level,1);
 assert.equal(transport(s,'scotland').incoming.iron,before+1);
 assert.ok(!transport(s,'england').rows.some(r=>r.tile===t.id),'foreign output is not direct home delivery');
 openMarket(s);assert.equal(s.minors.scotland.exportStock.iron,before+1,'foreign output enters minor market');
});
test('merchant cannot buy without embassy, buy food, or purchase another power property',()=>{
 const {s,t}=fixture();s.nations.england.embassies=[];assert.throws(()=>buy(s,t),/embassy/);
 s.nations.england.embassies=['scotland'];t.resource='grain';assert.throws(()=>buy(s,t),/non-food/);
 t.resource='iron';t.purchasedBy='france';assert.throws(()=>buy(s,t),/already purchased/);
 delete t.purchasedBy;t.owner='france';assert.throws(()=>buy(s,t),/Minor Nation/);
});
test('purchase cancels if conquered before completion; competing pending orders are rejected',()=>{
 const {s,t}=fixture();let next=buy(s,t);
 next.civilians.push({id:'merchant-second',owner:'england',type:'merchant',tile:s.nations.england.capital,order:null});
 assert.throws(()=>command(next,'england',{type:'civilian',unit:'merchant-second',job:'purchase',tile:t.id}),/Another Merchant/);
 next.tiles.find(q=>q.id===t.id).owner='france';next=finish(next);
 assert.equal(next.tiles.find(q=>q.id===t.id).purchasedBy,undefined);
 assert.equal(next.civilians.find(c=>c.id==='merchant-test').order,null);
});
