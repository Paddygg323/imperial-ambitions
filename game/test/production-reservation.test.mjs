import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {forecastStock} from '../forecast-stock.mjs';import {forecastAvailable} from '../forecast-available.mjs';
import {createGame,command,saveGame,loadGame} from '../engine.mjs';import {NATIVE_GOODS} from '../resource-categories.mjs';
test('production quantity change reserves material costs like300 original executions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-production-reservation-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,300);
 for(const c of audit.cases){
  const expected=[...c.otherReserved];for(const[g,q]of c.costs)expected[g]+=q*c.newQuantity;
  assert.deepEqual(c.result,expected);assert.equal(c.storedQuantity,c.newQuantity);
  assert.deepEqual(c.stock.map((stock,g)=>forecastAvailable({stock,reserved:expected[g]})),c.available);
 }
});
test('forecast stock follows live production reservation, saved orders and cancellation',()=>{
 let s=createGame();s.nations.england.stock.timber=20;
 s=command(s,'england',{type:'production',recipe:'lumber',quantity:2});
 s=loadGame(saveGame(s));const timber=NATIVE_GOODS.indexOf('timber');let f=forecastStock(s.nations.england);
 assert.equal(f.stock[timber],20);assert.equal(f.reserved[timber],4);
 assert.equal(forecastAvailable({stock:f.stock[timber],reserved:f.reserved[timber]}),16);
 s=command(s,'england',{type:'production',recipe:'lumber',quantity:1});assert.equal(forecastStock(s.nations.england).reserved[timber],2);
 s=command(s,'england',{type:'clearProduction'});f=forecastStock(s.nations.england);assert.equal(f.reserved[timber],0);assert.equal(f.stock[timber],20);
});

test('reductions remain possible with depleted materials, insufficient labour and other invalid standing orders',()=>{
 let s=createGame({transportModel:'ports'});const n=s.nations.england;n.stock.timber=0;n.stock.iron=0;n.orders.production.lumber=4;n.orders.production.castIron=4;
 const stock={...n.stock};
 for(const quantity of [3,2,1,0]){s=command(s,'england',{type:'production',recipe:'lumber',quantity});assert.equal(s.nations.england.orders.production.lumber,quantity);assert.equal(s.nations.england.orders.production.castIron,4);assert.deepEqual(s.nations.england.stock,stock);}
 assert.equal(loadGame(saveGame(s)).nations.england.orders.production.lumber,0);
 assert.throws(()=>command(s,'england',{type:'production',recipe:'lumber',quantity:1}),/Not enough/);
 assert.throws(()=>command(s,'england',{type:'production',recipe:'lumber',quantity:-1}),/Invalid/);
});

test('cast iron increase ignores wool shortage but still checks iron and shared labour',()=>{
 let s=createGame({transportModel:'ports'});const n=s.nations.england;n.stock.wool=0;n.stock.iron=2;n.orders.production.woolFabric=1;
 s=command(s,'england',{type:'production',recipe:'castIron',quantity:1});
 assert.equal(s.nations.england.orders.production.castIron,1);assert.equal(s.nations.england.orders.production.woolFabric,1);
 const poor=structuredClone(s);poor.nations.england.orders.production.castIron=0;poor.nations.england.stock.iron=0;
 assert.throws(()=>command(poor,'england',{type:'production',recipe:'castIron',quantity:1}),/Not enough iron/);
 const busy=structuredClone(s);busy.nations.england.stock.iron=20;
 assert.throws(()=>command(busy,'england',{type:'production',recipe:'castIron',quantity:2}),/labour/);
});
test('recipe increases still respect shared material reservations and unlocks',()=>{
 const s=createGame();s.nations.england.stock.timber=2;s.nations.england.orders.production.paper=1;
 assert.throws(()=>command(s,'england',{type:'production',recipe:'lumber',quantity:1}),/timber/);
 s.nations.england.known=[];assert.throws(()=>command(s,'england',{type:'production',recipe:'steel',quantity:1}),/Research required/);
});
