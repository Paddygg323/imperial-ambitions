import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
function fixture(good){
 let s=createGame();s.civilians=[];s.armies=[];s.ships=[];s.construction=[];
 for(const [id,n] of Object.entries(s.nations)){n.alive=id==='england';n.orders.production={};}
 for(const t of s.tiles)t.level=0;
 const n=s.nations.england;n.cash=10000;n.stock.grain=100;n.stock.meat=100;n.stock.sugar=0;n.stock.sugarCane=0;
 n.workers[0].type='apprentice';n.workers[0].fit=true;n.known=[...new Set([...n.known,'13','23'])];n.orders.production={sugar:1};
 s.tradeDeliveries=[{buyer:'england',seller:'france',good,quantity:good==='sugar'?1:2,unitPrice:100}];
 s.turnPhase='combat';return loadGame(saveGame(s));
}
test('imported cane waits until next manufacturing phase; apprentices lose fitness meanwhile',()=>{
 let s=finishTurnEconomy(fixture('sugarCane'));const n=s.nations.england;
 assert.equal(n.stock.sugarCane,2);assert.equal(n.stock.sugar,0);assert.equal(n.workers[0].fit,false);
 assert.equal(s.reports.find(r=>r.nation==='england'&&r.kind==='production').made,0);
 assert.equal(s.reports.find(r=>r.nation==='england'&&r.kind==='food').sick,1);
 s=loadGame(saveGame(s));s.turnPhase='combat';s=finishTurnEconomy(s);
 assert.equal(s.nations.england.stock.sugarCane,0);assert.equal(s.nations.england.workers[0].fit,true);
 assert.equal(s.nations.england.workers.length,n.workers.length);
});
test('delivered refined sugar feeds apprentices after production in the same turn',()=>{
 const s=finishTurnEconomy(fixture('sugar')),n=s.nations.england;
 assert.equal(n.workers[0].fit,true);assert.equal(n.stock.sugar,0);
 const r=s.reports.filter(r=>r.nation==='england');
 assert.ok(r.findIndex(x=>x.kind==='production')<r.findIndex(x=>x.kind==='tradeDelivery'));
 assert.ok(r.findIndex(x=>x.kind==='tradeDelivery')<r.findIndex(x=>x.kind==='food'));
 assert.equal(r.find(x=>x.kind==='food').sick,0);assert.deepEqual(loadGame(saveGame(s)),s);
});
