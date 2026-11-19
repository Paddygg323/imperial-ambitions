import test from 'node:test';import assert from 'node:assert/strict';
import {productionPlan} from '../production-plan.mjs';
import {createGame,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
test('standing production has priority and spare work respects inputs and technology',()=>{
 const n={stock:{timber:4,lumber:0,paper:0,iron:4,castIron:0,coal:4,steel:0},workers:Array.from({length:5},()=>({type:'peasant',fit:true})),known:[],orders:{production:{lumber:1}},autoProduction:true};
 const before=JSON.stringify(n),p=productionPlan(n);
 assert.equal(p.orders.lumber,1);assert.equal(p.orders.paper,1);assert.equal(p.orders.steel,0);assert.equal(p.remaining,1);assert.equal(JSON.stringify(n),before);
 assert.equal(productionPlan({...n,autoProduction:false}).remaining,3);
});
test('automatic work actually manufactures and persists into the next saved turn',()=>{
 let s=createGame();s.civilians=[];s.armies=[];s.ships=[];s.construction=[];
 for(const [id,n] of Object.entries(s.nations)){n.alive=id==='england';n.orders.production={};}
 for(const t of s.tiles)t.level=0;
 const n=s.nations.england;for(const g in n.stock)n.stock[g]=0;
 Object.assign(n.stock,{timber:4,grain:100,meat:100});n.autoProduction=true;n.orders.production={lumber:1};
 s.turnPhase='combat';s=finishTurnEconomy(s);
 assert.equal(s.nations.england.stock.lumber,1);assert.equal(s.nations.england.stock.paper,1);
 const reloaded=loadGame(saveGame(s));assert.equal(reloaded.nations.england.orders.production.lumber,1);assert.equal(reloaded.nations.england.orders.production.paper,1);assert.equal(reloaded.nations.england.autoProduction,true);
});
