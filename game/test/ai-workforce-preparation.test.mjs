import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
import {planEconomy} from '../ai.mjs';
import {transport} from '../economy.mjs';
import {workforceLuxuryTargets} from '../ai-workforce.mjs';
function fixture(){
 const s=createGame(),n=s.nations.france;s.civilians=[];
 n.known.push('13','23','45');n.cash=4000;n.stock.paper=10;n.stock.sugar=0;n.stock.sugarCane=8;
 n.stock.fabric=0;
 n.workers=Array.from({length:6},(_,i)=>({id:'prepare-'+i,type:'peasant',fit:true,diet:i%2?'grain':'meat'}));
 for(const [i,t] of s.tiles.filter(t=>t.owner==='france').entries())Object.assign(t,{resource:i%2?'grain':'meat',level:4,prospected:true});
 const crop=s.tiles.find(t=>t.id===n.capital);crop.resource='sugarCane';crop.level=2;
 return {s,n,crop};
}
test('AI prepares its first apprentice luxury then trains through real deliveries and reload',()=>{
 let {s,n}=fixture();assert.ok(transport(s,'france').incoming.sugarCane>=2);
 assert.equal(workforceLuxuryTargets(s,'france',transport(s,'france')).sugar,1);
 s=planEconomy(s,'france',command);
 assert.equal(s.nations.france.orders.production.sugar,2);
 assert.equal(s.nations.france.orders.trade.offers.sugar??0,0);
 s=finishTurnEconomy({...s,turnPhase:'combat'});s=loadGame(saveGame(s));
 assert.equal(s.nations.france.stock.sugar,2);
 const cash=s.nations.france.cash,paper=s.nations.france.stock.paper;
 s=planEconomy(s,'france',command);
 assert.equal(s.nations.france.cash,cash-100);
 assert.equal(s.nations.france.stock.paper,paper-1);
 s=finishTurnEconomy({...s,turnPhase:'combat'});
 assert.equal(s.nations.france.workers.filter(w=>w.type==='apprentice'&&w.fit).length,1);
});
test('preparation does not speculate on unavailable crop deliveries or ignore basic labour',()=>{
 const {s,n,crop}=fixture();crop.level=0;
 assert.equal(workforceLuxuryTargets(s,'france',transport(s,'france')).sugar,0);
 assert.equal(planEconomy(s,'france',command).nations.france.orders.production.sugar,0);
 crop.level=2;n.workers.length=4;
 assert.equal(workforceLuxuryTargets(s,'france',transport(s,'france')).sugar,0);
});
test('prepared luxury stock is retained from sale while promotion waits for a pending worker',()=>{
 let {s,n}=fixture();n.stock.sugar=2;
 s=command(s,'france',{type:'trainWorker',worker:'apprentice'});
 s=planEconomy(s,'france',command);
 assert.equal(s.nations.france.orders.trade.offers.sugar??0,0);
});
