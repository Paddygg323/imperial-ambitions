import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
import {planTransport,transportPlan} from '../ai-transport.mjs';
import {transport,homeCargo} from '../economy.mjs';
import {neighbourIds} from '../world.mjs';
function fixture(){
 const s=createGame(),n=s.nations.france;s.transportLinks={};s.civilians=[];
 for(const t of s.tiles.filter(t=>t.owner==='france')){t.port=false;delete t.transportSeaTile;t.road=false;t.rail=false;t.level=0;}
 const cap=s.tiles.find(t=>t.id===n.capital),remote=s.tiles.find(t=>t.owner==='france'&&Math.hypot(t.x-cap.x,t.y-cap.y)>5);
 remote.port=true;remote.resource='timber';remote.level=4;remote.prospected=true;
 return {s,n,remote,cap};
}
test('AI allocates real cargo to a port resource; delivery feeds next-turn manufacture after reload',()=>{
 let {s,n,remote}=fixture();assert.equal(transport(s,'france').incoming.timber,0);
 s=planTransport(s,'france',command);
 const qty=transport(s,'france').incoming.timber;assert.ok(qty>=2);assert.ok(qty<=homeCargo(s,'france'));
 n=s.nations.france;n.stock.timber=0;n.stock.lumber=0;
 s=finishTurnEconomy({...loadGame(saveGame(s)),turnPhase:'combat'});
 assert.equal(s.nations.france.stock.timber,qty);
 s=command(s,'france',{type:'production',recipe:'lumber',quantity:1});
 s=finishTurnEconomy({...s,turnPhase:'combat'});
 assert.equal(s.nations.france.stock.lumber,1);
});
test('food has priority over construction, and absent cargo clears stale allocations',()=>{
 const {s,n,remote}=fixture();const food=s.tiles.find(t=>t.owner==='france'&&neighbourIds(remote).includes(t.id));assert.ok(food);
 food.resource='grain';food.level=4;food.prospected=true;
 n.simpleFood=true;s.ships=s.ships.filter(u=>u.owner!=='france');
 assert.equal(Object.values(transportPlan(s,'france')).reduce((a,b)=>a+b,0),0);
 n.orders.transport.timber=99;
 const cleared=planTransport(s,'france',command);assert.equal(cleared.nations.france.orders.transport.timber,0);
 const original=createGame().ships.find(u=>u.owner==='france');s.ships.push(original);
 const result=transportPlan(s,'france');assert.equal(result.grain,Math.min(4,homeCargo(s,'france')));
 assert.ok(Object.values(result).reduce((a,b)=>a+b,0)<=homeCargo(s,'france'));
});
test('allocation excludes disconnected or unprospected resources and never changes player orders',()=>{
 const {s,n,remote}=fixture();remote.port=false;
 assert.equal(transportPlan(s,'france').timber,0);
 remote.port=true;remote.resource='iron';remote.terrain=8;remote.prospected=false;n.prospected=[];
 assert.equal(transportPlan(s,'france').iron,0);
 s.player='france';assert.equal(planTransport(s,'france',()=>{throw Error('player mutated');}),s);
});

test('live economy planner allocates overseas cargo before judging productive supply',async()=>{
 const {planEconomy}=await import('../ai.mjs');const {s}=fixture();
 const next=planEconomy(s,'france',command);
 assert.ok(next.nations.france.orders.transport.timber>=2);
 assert.ok(transport(next,'france').incoming.timber>=2);
});
