import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
import {planEconomy} from '../ai.mjs';
import {workforceTraining} from '../ai-workforce.mjs';
import {emptyGoods,labour} from '../economy.mjs';
function fixture(){
 const s=createGame(),n=s.nations.france;n.known.push('13','23');n.cash=2000;n.stock.paper=10;n.stock.sugar=4;
 n.workers=Array.from({length:6},(_,i)=>({id:'skilled-test-'+i,type:'peasant',fit:true,diet:i%2?'grain':'meat'}));
 const incoming={...emptyGoods(),grain:20,meat:20,sugarCane:2};
 return {s,n,network:{incoming}};
}
test('training requires ongoing luxury deliveries and leaves basic labour available',()=>{
 const {s,n,network}=fixture();assert.equal(workforceTraining(s,'france',network),'apprentice');
 network.incoming.sugarCane=0;assert.equal(workforceTraining(s,'france',network),null,'stockpile alone is insufficient');
 network.incoming.sugarCane=2;n.workers=n.workers.slice(0,4);assert.equal(workforceTraining(s,'france',network),null);
});
test('selected training uses player costs, survives reload and increases labour when fed',()=>{
 let {s,n,network}=fixture();const before=labour(n),cash=n.cash,paper=n.stock.paper;
 s=command(s,'france',{type:'trainWorker',worker:workforceTraining(s,'france',network)});
 assert.equal(s.nations.france.cash,cash-100);assert.equal(s.nations.france.stock.paper,paper-1);
 s=finishTurnEconomy({...loadGame(saveGame(s)),turnPhase:'combat'});
 assert.equal(s.nations.france.workers.filter(w=>w.type==='apprentice'&&w.fit).length,1);
 assert.equal(labour(s.nations.france),before+3);
});
test('live economy plan makes skilled-worker luxuries before ordinary manufacturing buffers',()=>{
 const {s,n}=fixture();s.civilians=[];n.workers[0].type='apprentice';n.stock.sugar=0;n.stock.sugarCane=8;
 const next=planEconomy(s,'france',command);
 assert.equal(next.nations.france.orders.production.sugar,2);
 const done=finishTurnEconomy({...next,turnPhase:'combat'});
 assert.ok(done.nations.france.workers.find(w=>w.type==='apprentice').fit);
});
