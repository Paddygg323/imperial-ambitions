import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
import {feed,emptyGoods} from '../economy.mjs';
import {readFileSync} from 'node:fs';

test('original manufacturing and food consumption leave predicted-needs deductions untouched',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-consumption-history-audit.json',import.meta.url)));
 assert.equal(audit.production.length,84);assert.equal(audit.food.length,3);
 for(const c of [...audit.production,...audit.food]){
  assert.deepEqual(c.beforeDeductions,Array.from({length:28},(_,i)=>300+i));
  assert.deepEqual(c.deductions,c.beforeDeductions);
  assert.notDeepEqual(c.deductions,c.stock);
  assert.notDeepEqual(c.deductions,c.consumed);
 }
});
test('consumption records completed manufacturing, paid recruitment and food through save/reload',()=>{
 let s=createGame();let n=s.nations.england;n.stock.timber=4;n.stock.fabric=20;n.stock.grain=100;n.stock.meat=100;
 n.workers=Array.from({length:10},(_,i)=>({id:'consume-'+i,type:'peasant',fit:true}));
 n.orders.production.lumber=4;
 s=command(s,'england',{type:'recruitWorker',quantity:2});s=loadGame(saveGame(s));
 assert.deepEqual(s.construction.map(c=>c.consumptionCost),[{fabric:2},{fabric:2}]);
 s.turnPhase='combat';s=finishTurnEconomy(s);n=s.nations.england;
 assert.equal(n.lastConsumption.timber,4,'records actual2 lumber made, not4 requested');assert.equal(n.lastConsumption.fabric,4);
 assert.equal(n.lastConsumption.lumber,0,'produced outputs and arrivals are not consumption');
 const food=s.reports.find(r=>r.nation==='england'&&r.kind==='food');assert.equal(n.lastConsumption.grain+n.lastConsumption.meat+n.lastConsumption.fish,food.population);
 s=loadGame(saveGame(s));assert.deepEqual(s.nations.england.lastConsumption,n.lastConsumption);
 s.nations.england.orders.production.lumber=0;s.turnPhase='combat';s=finishTurnEconomy(s);
 assert.equal(s.nations.england.lastConsumption.timber,0);assert.equal(s.nations.england.lastConsumption.fabric,0,'new phase resets previous recruitment usage');
});
test('food ledger counts eaten luxuries and fallback food, not unavailable requested food',()=>{
 const s=createGame(),n=s.nations.england;s.armies=[];s.ships=[];n.workers=[{id:'worker',type:'apprentice',diet:'grain',fit:true}];n.stock={...emptyGoods(),fish:1,sugar:1};
 const used=emptyGoods();feed(s,'england',[],used);assert.equal(used.grain,0);assert.equal(used.fish,1);assert.equal(used.sugar,1);
});
test('legacy queued costs stay unknown until a fully observed production phase',()=>{
 let s=createGame();delete s.nations.england.lastConsumption;s.construction=[{owner:'england',kind:'worker',type:'peasant'}];
 s=loadGame(saveGame(s));s.turnPhase='combat';s=finishTurnEconomy(s);assert.equal(s.nations.england.lastConsumption,undefined);
 s.turnPhase='combat';s=finishTurnEconomy(s);assert.ok(s.nations.england.lastConsumption);
 s.nations.england.lastConsumption.grain=-1;assert.throws(()=>saveGame(s),/consumption history/);
});
