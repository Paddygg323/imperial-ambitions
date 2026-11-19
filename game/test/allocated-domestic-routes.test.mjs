import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {conquerProvince} from '../conquest.mjs';
import {allocatedDomesticShipments,checkAllocatedDomesticShipments} from '../allocated-domestic-routes.mjs';
import {campaignDomesticDelivery} from '../campaign-domestic-delivery.mjs';
import {createConvoyInterceptor} from '../campaign-merchant.mjs';
import {settleDomesticBattleCargo} from '../campaign-transport.mjs';
import {SHIPS} from '../rules.mjs';

function campaign(){
 const s=createGame({seed:2}),n=s.nations.england,remote=s.nations.france.capital;
 conquerProvince(s,s.tiles.find(t=>t.id===remote).province,'england');
 for(const t of s.tiles)t.level=0;
 const port=s.tiles.find(t=>t.id===remote);port.resource='timber';port.level=4;port.prospected=true;
 const home=s.tiles.find(t=>t.id===n.capital);home.resource='grain';home.level=2;home.prospected=true;
 n.stock.timber=0;n.stock.grain=0;n.transportAssignments[remote].assigned[1]=4;
 n.ministers={foreign:0,defence:2};n.warSupport=.5;
 s.wars=[['england','portugal']];s.navalSeed=50;
 const zone=s.seas.cellZones[port.transportSeaTile];
 s.ships=[{id:'escort',owner:'england',type:'galleon',hp:1,cargo:6,location:'home',order:null},
  ...[0,1].map(i=>({id:'raider'+i,owner:'portugal',type:'ironclad',hp:60,cargo:SHIPS.ironclad.cargo,location:zone,order:null}))];
 return {s,n,remote,zone};
}
test('saved port order eligibility matches the executed native gate',()=>{
 const {s,n,remote}=campaign(),audit=JSON.parse(readFileSync(new URL('../../outputs/Native-domestic-port-gate-audit.json',import.meta.url)));
 for(const c of audit.eligibility){
  n.transportAssignments[remote].automatic=c.automatic;
  const shipments=allocatedDomesticShipments(s,'england',{networks:n.transportRoots.map(root=>({root,flag:root===remote?c.flag:0}))});
  assert.equal(shipments.length,c.eligible?1:0);
  if(c.eligible)assert.equal(shipments[0].quantity,4);
 }
});
test('source/destination cancellation and loss clear saved orders before reload and receipt',()=>{
 for(const outcome of ['canc','lost'])for(const atDestination of [false,true]){
  const {s,n,remote}=campaign(),calls=[];
  const result=checkAllocatedDomesticShipments(s,'england',(shipment,checkpoint)=>{calls.push(checkpoint.port);return atDestination&&checkpoint.port===remote?'okay':outcome;});
  assert.deepEqual(calls,atDestination?[remote,n.capital]:[remote]);assert.equal(result.length,1);
  assert.equal(n.transportAssignments[remote].assigned[1],0);
  const restored=loadGame(saveGame(s)),support=restored.nations.england.warSupport;
  assert.deepEqual(checkAllocatedDomesticShipments(restored,'england',()=>{throw Error('Zero allocation retried');}),[]);
  const receipt=campaignDomesticDelivery(restored,'england',{currentEvents:[]});
  assert.equal(receipt.nation.stock.timber,0);assert.equal(receipt.nation.stock.grain,2);
  assert.equal(receipt.nation.warSupport,support);
 }
});
test('real naval combat consumes the saved port allocation and cannot redeliver lost cargo',()=>{
 const {s,remote,zone}=campaign();
 const province=s.tiles.find(t=>t.id===remote).province;
 delete s.transportLinks;
 for(const tile of s.tiles.filter(t=>t.province===province)){tile.resource='timber';tile.level=4;tile.prospected=true;tile.rail=true;}
 const potential=campaignDomesticDelivery(s,'england',{currentEvents:[]}).potential.networks.find(r=>r.root===remote).quantities[1];
 s.nations.england.transportAssignments[remote].assigned[1]=potential;
 s.ships=s.ships.filter(u=>u.owner!=='england');
 for(let i=0;i<10;i++)s.ships.push({id:'escort'+i,owner:'england',type:'galleon',hp:50,cargo:6,location:'home',order:null});
 s.navalSeed=50;
 const fleets=[{owner:'portugal',ids:['raider0','raider1'],code:6,port:remote,zone,aggression:2}];
 const intercept=createConvoyInterceptor(s,fleets,{england:{ids:Array.from({length:10},(_,i)=>'escort'+i),cargo:60}},settleDomesticBattleCargo,{kind:'domesticBattle',label:'Domestic'});
 const result=checkAllocatedDomesticShipments(s,'england',intercept);
 assert.equal(result[0]?.outcome,'lost');assert.equal(s.nations.england.transportAssignments[remote].assigned[1],0);
 const report=s.reports.find(r=>r.kind==='domesticBattle');assert.ok(report);assert.ok(report.sunk.length>0);
 const restored=loadGame(saveGame(s));
 assert.equal(campaignDomesticDelivery(restored,'england',{currentEvents:[]}).nation.stock.timber,0);
 assert.deepEqual(restored.ships,s.ships);
});
test('safe shipments never enter naval encounters or lose their orders',()=>{
 const {s,remote}=campaign();s.wars=[];
 assert.deepEqual(checkAllocatedDomesticShipments(s,'england',()=>{throw Error('Safe route attacked');}),[]);
 assert.equal(s.nations.england.transportAssignments[remote].assigned[1],4);
 assert.equal(campaignDomesticDelivery(s,'england',{currentEvents:[]}).nation.stock.timber,4);
});
