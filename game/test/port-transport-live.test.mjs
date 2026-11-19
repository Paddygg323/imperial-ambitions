import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,transport,finishTurnEconomy,beginTurn,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {conquerProvince} from '../conquest.mjs';
import {SHIPS} from '../rules.mjs';
import {campaignTransportPotential} from '../campaign-transport-potential.mjs';
import {campaignTransportNetworks} from '../campaign-port-danger.mjs';
import {resolveFleets} from '../navy.mjs';

function scenario(){
 const s=createGame({transportModel:'ports',preferenceSeed:123}),n=s.nations.england,remote=s.nations.france.capital;
 conquerProvince(s,s.tiles.find(t=>t.id===remote).province,'england');
 for(const t of s.tiles)t.level=0;
 for(const [root,level] of [[n.capital,2],[remote,4]]){const t=s.tiles.find(t=>t.id===root);t.resource='timber';t.level=level;t.prospected=true;}
 n.stock.timber=0;n.stock.lumber=0;n.stock.grain=500;n.stock.meat=500;
 s.civilians=[];s.armies=[];s.construction=[];
 for(const [id,other] of Object.entries(s.nations))other.alive=id==='england';
 return {s,remote};
}
test('live manual allocation, preview, saved orders and standing manufacturing use the same port totals',()=>{
 let {s,remote}=scenario();s=command(s,'england',{type:'transport',good:'timber',quantity:2});
 assert.equal(s.nations.england.transportAssignments[remote].assigned[1],2);
 assert.equal(transport(s,'england').incoming.timber,4);
 s.nations.england.orders.production={lumber:2};s=loadGame(saveGame(s));s.turnPhase='combat';
 const end=finishTurnEconomy(s);assert.equal(end.nations.england.stock.lumber,2);assert.equal(end.nations.england.stock.timber,0);
 assert.equal(end.reports.find(r=>r.nation==='england'&&r.kind==='deliveries').goods.timber,4);
 assert.equal(end.nations.england.transportAssignments[remote].assigned[1],2);
 assert.equal(loadGame(saveGame(end)).transportModel,'ports');
});
test('manual allocation rejects unavailable cargo atomically and legacy saves keep their original model',()=>{
 let {s}=scenario();s.ships=[];const before=JSON.stringify(s);
 assert.throws(()=>command(s,'england',{type:'transport',good:'timber',quantity:1}),/home-fleet cargo/);assert.equal(JSON.stringify(s),before);
 const legacy=createGame();assert.equal(loadGame(saveGame(legacy)).transportModel,undefined);
 assert.equal(transport(legacy,'england').nativePorts,undefined);
});
test('three complete new-model turns run AI shipping forecasts, market, fleets and economy across reloads',()=>{
 let s=createGame({transportModel:'ports',preferenceSeed:123});
 for(let i=0;i<3;i++){
  s=beginTurn(s);let offers=0;
  while(!s.market.complete){assert.ok(offers++<1000);s=command(s,s.player,{type:'tradeAccept',quantity:0});}
  s=resolveTurn(s);assert.equal(s.pendingLandAttacks?.length??0,0);assert.equal(s.turn,i+1);
  s=loadGame(saveGame(s));
  for(const [id,n] of Object.entries(s.nations))if(id!==s.player&&n.alive){assert.equal(n.shippingPriorities.length,28);assert.ok(s.reports.some(r=>r.nation===id&&r.kind==='deliveries'));}
 }
});

test('live navy dispatcher clears port orders and paused-combat reload cannot restore lost deliveries',()=>{
 let {s,remote}=scenario();s.nations.portugal.alive=true;
 const province=s.tiles.find(t=>t.id===remote).province;delete s.transportLinks;
 for(const tile of s.tiles.filter(t=>t.province===province)){tile.resource='timber';tile.level=4;tile.prospected=true;tile.rail=true;}
 const zone=s.seas.cellZones[s.tiles.find(t=>t.id===remote).transportSeaTile];
 s.ships=Array.from({length:10},(_,i)=>({id:'escort'+i,owner:'england',type:'galleon',hp:50,cargo:6,location:'home',order:null}));
 for(let i=0;i<2;i++)s.ships.push({id:'raider'+i,owner:'portugal',type:'ironclad',hp:60,cargo:SHIPS.ironclad.cargo,location:zone,aggression:2,order:{job:'blockade',fleet:'raiders',port:remote}});
 const potential=campaignTransportPotential(s,'england',{networks:campaignTransportNetworks(s,'england')}).networks.find(r=>r.root===remote).quantities[1];
 s=command(s,'england',{type:'transport',good:'timber',quantity:potential});
 const homeOnly=transport(s,'england').incoming.timber-potential;
 s.wars=[['england','portugal']];s.navalSeed=50;s.turnPhase='combat';s.reports=[];resolveFleets(s);
 assert.ok(s.reports.some(r=>r.kind==='domesticBattle'&&r.outcome==='lost'));
 assert.equal(s.nations.england.transportAssignments[remote].assigned[1],0);
 assert.equal(s.domesticInterceptions,undefined);
 s=finishTurnEconomy(loadGame(saveGame(s)));
 assert.equal(s.nations.england.stock.timber,homeOnly);
 assert.equal(s.reports.find(r=>r.nation==='england'&&r.kind==='deliveries').goods.timber,homeOnly);
});
