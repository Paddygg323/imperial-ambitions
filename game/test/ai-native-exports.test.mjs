import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame} from '../engine.mjs';
import {planEconomy} from '../ai.mjs';
import {nativeExportPlan} from '../ai-native-exports.mjs';
import {setTradeOrder,openMarket,nextOffer,acceptOffer} from '../trade.mjs';
import {productionBudget} from '../economy.mjs';
function fixture(){const s=planEconomy(createGame({transportModel:'ports',preferenceSeed:123}),'france',command);s.civilians=[];const n=s.nations.france;n.orders.trade={bids:[],offers:{}};n.stock.iron=30;s.prices={...s.prices,iron:300};return {s,n};}
test('high-price exports respect manufacturing inputs, bids and cargo and survive reload deterministically',()=>{
 const {s,n}=fixture();n.orders.production.castIron=2;
 const before=saveGame(s),a=nativeExportPlan(s,'france'),b=nativeExportPlan(loadGame(before),'france');
 assert.deepEqual(a,b);assert.equal(saveGame(s),before,'planning must not mutate the save');
 assert.ok(a.offers.iron>0&&a.offers.iron<=5);assert.ok(a.offers.iron<=productionBudget(n).stock.iron);
 n.orders.trade.bids=['iron'];assert.equal(nativeExportPlan(s,'france').offers.iron,undefined);
 n.orders.trade.bids=[];for(const ship of s.ships.filter(x=>x.owner==='france'))ship.order={job:'sail'};
 assert.deepEqual(nativeExportPlan(s,'france').offers,{});
});
test('native planned export can become an actual market purchase without inventing goods',()=>{
 const {s,n}=fixture();const plan=nativeExportPlan(s,'france');
 for(const country of Object.values(s.nations))country.orders.trade={bids:[],offers:{}};
 s.minors={};setTradeOrder(s,'france',{good:'iron',quantity:plan.offers.iron});setTradeOrder(s,'england',{good:'iron',bid:true});
 const market=openMarket(s),offer=nextOffer(s,market);assert.equal(offer.good,'iron');
 const stock=n.stock.iron,cash=n.cash;acceptOffer(s,market,'england',1);
 assert.equal(n.stock.iron,stock-1);assert.ok(n.cash>cash);assert.equal(market.inTransit[0].quantity,1);
});
