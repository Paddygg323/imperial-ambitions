import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,resolveTurn,saveGame,loadGame,finishTurnEconomy} from '../engine.mjs';
import {generateSeas,portSeas} from '../overseas.mjs';
import {resolveFleets} from '../navy.mjs';
import {transport} from '../economy.mjs';
import {SHIPS} from '../rules.mjs';
function fixture(){
 const s=createGame({seed:2,simpleFood:true});s.nations={england:s.nations.england,france:s.nations.france};
 s.nations.england.capital='0,0';s.nations.france.capital='25,0';s.minors={};s.tiles=[];
 const tile=(x,y,owner,province,resource=null)=>({id:`${x},${y}`,x,y,owner,province,terrain:1,mineral:0,resource,prospected:true,level:resource?4:0,road:false,rail:!!resource,port:false,townLevel:0,river:false});
 s.tiles.push(tile(0,0,'england','home'),tile(25,0,'france','france'));
 for(let y=10;y<13;y++)for(let x=10;x<15;x++)s.tiles.push(tile(x,y,'england','remote','timber'));
 s.tiles.find(t=>t.id==='10,10').port=true;
 s.provinces=[{id:'home',town:'0,0',owner:'england',old:false},{id:'france',town:'25,0',owner:'france',old:false},{id:'remote',town:'10,10',owner:'england',old:false}];
 s.seas=generateSeas(s.tiles,30,20);s.civilians=[];s.armies=[];s.construction=[];s.wars=[['france','england']];
 for(const n of Object.values(s.nations)){n.orders.transport={};n.orders.production={};n.projects=[];n.stock.grain=500;n.stock.meat=500;}
 s.nations.england.orders.transport.timber=60;
 const zone=portSeas(s,'10,10')[0];s.ships=[];
 for(let i=0;i<10;i++)s.ships.push({id:'escort'+i,owner:'england',type:'galleon',hp:50,cargo:6,location:'home',order:null});
 for(let i=0;i<2;i++)s.ships.push({id:'raider'+i,owner:'france',type:'ironclad',hp:60,cargo:SHIPS.ironclad.cargo,location:zone,aggression:2,order:{job:'blockade',fleet:'raiders',port:'10,10'}});
 s.navalSeed=50;s.tradeDeliveries=[];s.market={complete:true,deals:[],inTransit:[],diplomacy:[]};return s;
}
test('live domestic blockade resolves combat, removes resource delivery and credits captured goods',()=>{
 const s=fixture();assert.equal(transport(s,'england').incoming.timber,60);
 const end=resolveTurn(s),again=resolveTurn(loadGame(saveGame(s)));assert.deepEqual(end,again);
 const battle=end.reports.find(r=>r.kind==='domesticBattle'&&r.nation==='france');assert.ok(battle);assert.equal(battle.outcome,'lost');
 assert.equal(end.nations.england.stock.timber,s.nations.england.stock.timber);
 assert.equal(end.nations.france.stock.timber,s.nations.france.stock.timber+battle.captured);
 assert.ok(battle.sunk.length>0);assert.equal(end.domesticInterceptions,undefined);
 assert.deepEqual(loadGame(saveGame(end)),end);
});
test('domestic loss survives a paused combat save and applies once at economy resolution',()=>{
 const s=fixture();delete s.market;s.turnPhase='combat';s.reports=[];
 resolveFleets(s);assert.ok(s.domesticInterceptions.length>0);
 const end=finishTurnEconomy(loadGame(saveGame(s)));
 assert.equal(end.nations.england.stock.timber,s.nations.england.stock.timber);
 assert.equal(end.domesticInterceptions,undefined);
 assert.throws(()=>finishTurnEconomy(end),/No turn economy/);
});
test('neutral fleet leaves domestic resources available for delivery',()=>{
 const s=fixture();s.wars=[];const end=resolveTurn(s);
 assert.ok(!end.reports.some(r=>r.kind==='domesticBattle'));
 assert.equal(end.nations.england.stock.timber,s.nations.england.stock.timber+60);
});

test('captured domestic riches convert to raider income rather than ordinary warehouse stock',()=>{
 const s=fixture();for(const t of s.tiles)if(t.resource==='timber')t.resource='gold';
 s.nations.england.orders.transport={gold:60};
 const before=s.nations.france.cash;
 const end=resolveTurn(s),battle=end.reports.find(r=>r.kind==='domesticBattle'&&r.nation==='france');
 assert.equal(battle.outcome,'lost');assert.ok(battle.captured>0);
 assert.equal(end.nations.france.lastIncome.riches,battle.captured*200);
 assert.equal(end.nations.france.stock.gold,s.nations.france.stock.gold);
 assert.equal(end.nations.france.cash,before+battle.captured*200);
 assert.equal(end.nations.england.lastIncome.riches,0);
});
test('saved domestic interception requires a valid combat phase, nation, port and commodity',()=>{
 const s=fixture();delete s.market;s.turnPhase='combat';s.reports=[];resolveFleets(s);
 for(const patch of [{nation:'missing'},{sourcePort:'missing'},{good:'missing'},{outcome:'invented'}]){
  const bad=structuredClone(s);Object.assign(bad.domesticInterceptions[0],patch);
  assert.throws(()=>loadGame(JSON.stringify(bad)),/Invalid domestic interception/);
 }
 const bad=structuredClone(s);delete bad.turnPhase;assert.throws(()=>saveGame(bad),/Invalid domestic interceptions/);
});

test('real domestic convoy loss records support before save and does not repeat it on delivery settlement',async()=>{
 const {warSupportEvent,periodicWarSupport}=await import('../war-support.mjs');
 const s=fixture();s.nations.england.ministers={foreign:0,defence:2};s.nations.england.warSupport=.5;
 delete s.market;s.turnPhase='combat';s.reports=[];resolveFleets(s);
 assert.ok(s.domesticInterceptions.some(x=>x.nation==='england'&&x.outcome==='lost'));
 assert.ok(s.ships.some(u=>u.owner==='england'&&u.hp>0));assert.ok(s.ships.some(u=>u.owner==='france'&&u.hp>0));
 const expected=warSupportEvent(.5,2,8);
 assert.equal(s.nations.england.warSupport,expected);
 const end=finishTurnEconomy(loadGame(saveGame(s)));
 assert.equal(end.nations.england.warSupport,periodicWarSupport(expected,2,{atWarWithGreatPower:true}));
});
