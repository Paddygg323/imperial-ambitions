import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {portSeas} from '../overseas.mjs';
import {SHIPS} from '../rules.mjs';
function fixture(){
 const s=createGame({seed:2,simpleFood:true}),zone=portSeas(s,s.nations.england.capital)[0];s.ships=[];s.wars=[['france','england']];
 for(let i=0;i<10;i++)s.ships.push({id:'escort'+i,owner:'england',type:'galleon',hp:50,cargo:6,location:'home',order:null});
 for(let i=0;i<2;i++)s.ships.push({id:'raider'+i,owner:'france',type:'ironclad',hp:60,cargo:SHIPS.ironclad.cargo,location:zone,aggression:2,order:{job:'blockade',fleet:'raiders',port:s.nations.england.capital}});
 s.tradeDeliveries=[{seller:'portugal',buyer:'england',good:'lumber',quantity:60,unitPrice:40}];
 // Completed market avoids unrelated AI choices; normal combat and economy still execute.
 s.market={complete:true,deals:[],inTransit:[],diplomacy:[]};return s;
}
test('actual turn resolves merchant battle, stock loss, loot and saved casualties deterministically',()=>{
 const s=fixture(),before=s.nations.england.stock.lumber;
 const end=resolveTurn(s),repeat=resolveTurn(loadGame(saveGame(s)));assert.deepEqual(end,repeat);
 const report=end.reports.find(r=>r.kind==='merchantBattle'&&r.nation==='france');assert.ok(report);assert.equal(report.outcome,'lost');assert.equal(report.reportedLost,12);assert.equal(report.captured,6);
 assert.ok(report.sunk.length>0);for(const id of report.sunk)assert.ok(!end.ships.some(s=>s.id===id));
 assert.equal(end.nations.england.stock.lumber,before);assert.equal(end.nations.france.stock.lumber,s.nations.france.stock.lumber+6);
 assert.ok(!end.reports.some(r=>r.kind==='tradeDelivery'));assert.deepEqual(end.tradeDeliveries,[]);assert.equal(end.turn,1);
 assert.deepEqual(loadGame(saveGame(end)),end);
});
test('neutral raiders do not intercept a shipment and its goods arrive',()=>{
 const s=fixture();s.wars=[];const end=resolveTurn(s);
 assert.ok(!end.reports.some(r=>r.kind==='merchantBattle'));assert.equal(end.nations.england.stock.lumber,s.nations.england.stock.lumber+60);
});

test('captured convoy escorts retain their physical port rather than teleporting to captor home fleet',()=>{
 const s=fixture(),raider=s.ships.find(u=>u.owner==='france');s.ships.push({...structuredClone(raider),id:'raider2'},{...structuredClone(raider),id:'raider3'});
 const end=resolveTurn(s),report=end.reports.find(r=>r.kind==='merchantBattle'&&r.nation==='france');assert.ok(report.capturedShips.length>0);
 for(const id of report.capturedShips){const prize=end.ships.find(u=>u.id===id);assert.equal(prize.owner,'france');assert.equal(prize.location,'port:'+s.nations.england.capital);assert.equal(prize.order,null);}
});

test('war with a Great-Power seller does not authorize cancelling its neutral buyer convoy',()=>{
 const s=fixture();s.wars=[['france','portugal']];const zone=portSeas(s,s.nations.portugal.capital)[0];
 for(const ship of s.ships.filter(u=>u.owner==='france')){ship.location=zone;ship.order.port=s.nations.portugal.capital;}
 const end=resolveTurn(s);assert.ok(!end.reports.some(r=>['merchantBattle','neutralTradeCancelled','tradeInterception'].includes(r.kind)));
 assert.equal(end.nations.england.stock.lumber,s.nations.england.stock.lumber+60);
});

test('a sale to a minor uses the Great-Power seller escorts in live interception',()=>{
 const s=fixture(),minor=Object.values(s.minors)[0];s.navalSeed=1;s.tradeDeliveries=[{seller:'england',buyer:minor.id,carrier:'england',good:'lumber',quantity:60,unitPrice:40}];
 const end=resolveTurn(s);const report=end.reports.find(r=>r.kind==='merchantBattle'&&r.nation==='england');
 assert.ok(report);assert.ok(report.rounds>0);assert.equal(report.buyer,minor.id);assert.equal(end.minors[minor.id].stock.lumber,report.outcome==='lost'?0:60);assert.equal(end.tradeDeliveries.length,0);
});
