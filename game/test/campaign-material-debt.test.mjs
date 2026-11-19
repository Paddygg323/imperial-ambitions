import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame,finishTurnEconomy} from '../engine.mjs';
import {emptyGoods,deliver} from '../economy.mjs';import {deliverTrade} from '../trade.mjs';
import {workforceTraining} from '../ai-workforce.mjs';
function fixture(){
 const s=createGame(),n=s.nations.france;
 n.known.push('13','23');n.cash=2000;n.stock.paper=0;n.stock.sugar=4;
 n.workers=Array.from({length:6},(_,i)=>({id:'debt-worker-'+i,type:'peasant',fit:true,diet:i%2?'grain':'meat'}));
 return s;
}
test('AI training advance persists, consumes real workers/cash and repays from manufacturing',()=>{
 let s=fixture();const network={incoming:{...emptyGoods(),grain:20,meat:20,sugarCane:2}};
 assert.equal(workforceTraining(s,'france',network),'apprentice');
 s=command(s,'france',{type:'trainWorker',worker:'apprentice',materialAdvance:true});
 assert.equal(s.nations.france.materialDebt.paper,1);assert.equal(s.nations.france.stock.paper,0);
 assert.equal(s.nations.france.cash,1900);assert.equal(s.nations.france.workers.length,5);
 assert.throws(()=>command(s,'france',{type:'trainWorker',worker:'apprentice',materialAdvance:true}),/already queued/);
 s=loadGame(saveGame(s));assert.equal(s.nations.france.materialDebt.paper,1);
 s=command(s,'france',{type:'production',recipe:'paper',quantity:2});
 s=finishTurnEconomy({...s,turnPhase:'combat'});
 assert.equal(s.nations.france.materialDebt.paper,0);assert.equal(s.nations.france.stock.paper,1);
 assert.equal(s.nations.france.workers.filter(w=>w.type==='apprentice').length,1);
});
test('material debt is paid by domestic and purchased goods without duplicating stock',()=>{
 const s=fixture(),n=s.nations.france;n.materialDebt={paper:3};
 deliver(n,{incoming:{paper:2},rows:[]},[]);
 assert.equal(n.stock.paper,0);assert.equal(n.materialDebt.paper,1);
 s.tradeDeliveries=[{buyer:'france',seller:'england',good:'paper',quantity:3}];
 deliverTrade(s,'france',[]);assert.equal(n.stock.paper,2);assert.equal(n.materialDebt.paper,0);
 deliverTrade(s,'france',[]);assert.equal(n.stock.paper,2);
});
test('advances cannot bypass human costs or failed recruitment, and malformed debt is rejected',()=>{
 const s=fixture();s.player='france';
 assert.throws(()=>command(s,'france',{type:'trainWorker',worker:'apprentice',materialAdvance:true}),/AI planning/);
 assert.throws(()=>command(s,'france',{type:'trainWorker',worker:'apprentice'}),/paper/);
 s.player='england';s.nations.france.cash=-100000;
 const before=structuredClone(s);assert.throws(()=>command(s,'france',{type:'trainWorker',worker:'apprentice',materialAdvance:true}));assert.deepEqual(s,before);
 s.nations.france.cash=1000;s.nations.france.materialDebt={paper:-1};
 assert.throws(()=>loadGame(saveGame(s)),/material debt/);
});
