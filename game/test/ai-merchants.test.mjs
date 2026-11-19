import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {merchantTarget,merchantReserve,planMerchants} from '../ai-merchants.mjs';
import {homeCargo} from '../economy.mjs';import {SHIPS} from '../rules.mjs';
function fixture(){
 const s=createGame(),n=s.nations.france;s.civilians=[];s.ships=s.ships.filter((ship,i,all)=>all.findIndex(u=>u.owner===ship.owner)===i);
 n.workers=Array.from({length:8},(_,i)=>({id:'merchant-worker'+i,type:'peasant',fit:true,diet:i%2?'meat':'grain'}));
 for(const g of Object.keys(n.stock))n.stock[g]=100;
 for(const [i,t] of s.tiles.filter(t=>t.owner==='france').entries())Object.assign(t,{resource:i%2?'grain':'meat',level:4,rail:true,prospected:true});
 s.reports=[{nation:'france',kind:'trade',seller:'ireland',buyer:'france',good:'timber',quantity:homeCargo(s,'france'),total:300}];return s;
}
test('saturated merchant fleet recruits a real ship using materials and a worker, then completes after reload',()=>{
 const s=fixture(),key=merchantTarget(s,'france');assert.ok(key);
 const before=homeCargo(s,'france'),n=s.nations.france;
 const next=planMerchants(s,'france',command);
 assert.equal(next.construction.filter(c=>c.owner==='france'&&c.kind==='ship').length,1);
 assert.equal(next.nations.france.workers.length,7);
 for(const [g,q] of Object.entries(SHIPS[key].cost.goods))assert.equal(next.nations.france.stock[g],n.stock[g]-q);
 assert.equal(homeCargo(next,'france'),before,'queued ship is not available cargo');
 assert.equal(merchantTarget(next,'france'),null,'do not duplicate a pending ship');
 const loaded=loadGame(saveGame(next));const done=resolveTurn(loaded);
 assert.equal(homeCargo(done,'france'),before+SHIPS[key].cargo);
});
test('idle cargo, small workforce and missing reserves prevent speculative merchant recruitment',()=>{
 const s=fixture();s.reports=[];assert.equal(merchantTarget(s,'france'),null);
 s.ships=s.ships.filter(u=>u.owner!=='france');assert.ok(merchantTarget(s,'france'),'replace missing home fleet');
 const reserve=merchantReserve(s,'france');s.nations.france.stock.lumber=reserve.lumber-1;
 assert.equal(planMerchants(s,'france',command),s);
 s.nations.france.workers.length=6;assert.equal(merchantTarget(s,'france'),null);
});
test('foreign ships carrying our exports do not count as our cargo demand',()=>{
 const s=fixture();s.reports=[{nation:'france',kind:'trade',seller:'france',buyer:'england',quantity:99}];
 assert.equal(merchantTarget(s,'france'),null);
});

test('established economy builds an exploration reserve without first saturating trade',async()=>{
 const {explorationFleetNeeded}=await import('../ai-exploration-fleet.mjs');
 const {explorationOrder}=await import('../ai-exploration.mjs');
 let s=fixture();s.reports=[];
 for(let i=8;i<12;i++)s.nations.france.workers.push({id:'exploration-worker'+i,type:'peasant',fit:true,diet:i%2?'grain':'meat'});
 assert.equal(explorationFleetNeeded(s,'france'),true);assert.ok(merchantTarget(s,'france'));
 const before=s.ships.filter(u=>u.owner==='france').length;
 s=planMerchants(s,'france',command);assert.equal(s.construction.filter(c=>c.owner==='france'&&c.kind==='ship').length,1);
 s=resolveTurn(loadGame(saveGame(s)));
 assert.equal(s.ships.filter(u=>u.owner==='france').length,before+1);
 const order=explorationOrder(s,'france');assert.ok(order);
 const next=command(s,'france',order);assert.ok(next.ships.some(u=>u.owner==='france'&&u.order?.job==='sail'));
 assert.equal(explorationFleetNeeded(next,'france'),false,'one assigned explorer is sufficient');
});
