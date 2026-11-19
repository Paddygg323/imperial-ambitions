import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveFleets,orderFleet} from '../navy.mjs';
import {SHIPS} from '../rules.mjs';
function fixture(){
 const ship=(id,owner,type,order=null)=>({id,owner,type,hp:SHIPS[type].hull,cargo:SHIPS[type].cargo,location:'sea0',order});
 return {seed:1,sequence:1,seas:{zones:[{id:'sea0',coast:[],adjacent:['sea1']},{id:'sea1',coast:[],adjacent:['sea0']}],cellZones:{}},tiles:[],provinces:[],nations:{england:{id:'england',alive:true,known:[],revealed:[]},portugal:{id:'portugal',alive:true,known:[],revealed:[]}},ships:[ship('a','england','galleon',{job:'patrol',fleet:'a'}),ship('b','portugal','galleon')],reports:[],wars:[['england','portugal']]};
}
test('sea patrol resolves actual hostile fleet hull, casualties and reports, deterministically after reload',()=>{
 const s=fixture(),copy=JSON.parse(JSON.stringify(s));resolveFleets(s);resolveFleets(copy);assert.deepEqual(s,copy);
 const report=s.reports.find(r=>r.kind==='navalBattle');assert.ok(report);assert.equal(s.reports.filter(r=>r.kind==='navalBattle').length,2);
 assert.ok(s.ships.length<2||s.ships.some(s=>s.hp<SHIPS[s.type].hull));
 for(const id of report.result.sunk)assert.ok(!s.ships.some(s=>s.id===id));
 for(const prize of report.result.captured){const ship=s.ships.find(s=>s.id===prize.id);assert.equal(ship.owner,prize.owner);assert.equal(ship.hp,1);assert.equal(ship.order,null);}
});
test('patrol does not attack neutral fleets, other zones, or home merchant reserve',()=>{
 for(const mode of ['neutral','otherZone','home']){const s=fixture();if(mode==='neutral')s.wars=[];else s.ships[1].location=mode==='home'?'home':'sea1';const before=structuredClone(s.ships);resolveFleets(s);assert.deepEqual(s.ships,before);assert.equal(s.reports.length,0);assert.equal(s.navalSeed,undefined);}
});
test('patrol persists, occupies selected fleet and must be cancelled before sailing',()=>{
 const s=fixture();s.wars=[];s.ships[0].order=null;orderFleet(s,'england',{ships:['a'],job:'patrol'});const order=structuredClone(s.ships[0].order);resolveFleets(s);assert.deepEqual(s.ships[0].order,order);
 assert.throws(()=>orderFleet(s,'england',{ships:['a'],job:'sail',zone:'sea1'}),/already has orders/);
 orderFleet(s,'england',{ships:['a'],job:'aggression',level:0});assert.equal(s.ships[0].aggression,0);assert.deepEqual(s.ships[0].order,order);
 orderFleet(s,'england',{ships:['a'],job:'cancel'});orderFleet(s,'england',{ships:['a'],job:'sail',zone:'sea1'});resolveFleets(s);assert.equal(s.ships[0].location,'sea1');assert.equal(s.ships[0].order,null);
 assert.throws(()=>orderFleet(s,'england',{ships:['a'],job:'invented',zone:'sea0'}),/Unknown/);
 s.ships[0].location='home';assert.throws(()=>orderFleet(s,'england',{ships:['a'],job:'patrol'}),/Sail out/);
});
test('sailing into a hostile patrol is checked after arrival, not only when orders were assigned',()=>{
 const s=fixture();s.ships[1].location='sea1';orderFleet(s,'portugal',{ships:['b'],job:'sail',zone:'sea0'});resolveFleets(s);
 assert.ok(s.reports.some(r=>r.kind==='navalBattle'));assert.equal(s.reports[0].kind,'navy');
});

test('normal campaign turn invokes patrol combat and retains its results in the saved game',async()=>{
 const {createGame,command,resolveTurn,saveGame,loadGame}=await import('../engine.mjs');
 const {shipSea}=await import('../navy.mjs');let s=createGame({seed:1,simpleFood:true});
 s.nations={england:s.nations.england,portugal:s.nations.portugal};s.ships=s.ships.filter(u=>s.nations[u.owner]);s.civilians=s.civilians.filter(u=>s.nations[u.owner]);
 const zone=shipSea(s,s.ships[0]);for(const ship of s.ships){ship.location=zone;ship.type='galleon';ship.hp=50;ship.cargo=6;}
 s.wars=[['england','portugal']];s=command(s,'england',{type:'fleet',ships:[s.ships.find(u=>u.owner==='england').id],job:'patrol'});
 s=resolveTurn(s);assert.ok(s.reports.some(r=>r.kind==='navalBattle'));assert.equal(s.turn,1);
 const loaded=loadGame(saveGame(s));assert.deepEqual(loaded.ships,s.ships);assert.equal(loaded.navalSeed,s.navalSeed);assert.deepEqual(loaded.reports,s.reports);
});

test('arriving ordered forces stay separate from idle ships and other sail selections',async()=>{
 const {campaignSeaFleets}=await import('../campaign-naval.mjs');
 const s=fixture();s.wars=[];s.ships[0].order=null;
 s.ships.push({...s.ships[0],id:'c',location:'sea1',aggression:2},{...s.ships[0],id:'d',location:'sea1',aggression:0},{...s.ships[0],id:'e',location:'sea1'});
 orderFleet(s,'england',{ships:['c','d'],job:'sail',zone:'sea0'});orderFleet(s,'england',{ships:['e'],job:'sail',zone:'sea0'});
 const departed=new Map(s.ships.map(u=>[u.id,u.order?{...u.order}:null]));resolveFleets(s);
 const groups=campaignSeaFleets(s,departed).filter(f=>f.owner==='england');assert.equal(groups.length,3);
 const combined=groups.find(f=>f.ids.includes('c'));assert.deepEqual(combined.ids,['c','d']);assert.equal(combined.aggression,1);assert.equal(combined.code,1);
 assert.equal(groups.find(f=>f.ids.includes('a')).code,4);assert.deepEqual(groups.find(f=>f.ids.includes('e')).ids,['e']);
});

test('fleet aggression matches all native combinations of up to four ship settings',async()=>{
 const {readFileSync}=await import('node:fs'),{fleetAggression}=await import('../campaign-naval.mjs');
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-fleet-aggression-audit.json',import.meta.url),'utf8'));assert.equal(audit.cases.length,121);
 for(const c of audit.cases)assert.equal(fleetAggression(c.values.map(aggression=>({aggression}))),c.aggression,JSON.stringify(c));
});

test('sailing force engages a hostile beachhead at destination without requiring patrol orders',()=>{
 const s=fixture();s.ships[0].order=null;s.ships[0].location='sea1';
 s.ships[1].order={job:'beachhead',fleet:'landing',province:'coast',readyTurn:0};
 orderFleet(s,'england',{ships:['a'],job:'sail',zone:'sea0'});
 const copy=structuredClone(s);resolveFleets(s);resolveFleets(copy);assert.deepEqual(s,copy);
 const battle=s.reports.find(r=>r.kind==='navalBattle');assert.ok(battle);
 assert.equal(battle.result.attacker,'england');assert.equal(battle.result.defender,'portugal');assert.equal(battle.result.zone,'sea0');
});

test('sailing interception ignores neutral and non-destination landing fleets',()=>{
 for(const mode of ['neutral','origin']){
  const s=fixture();s.ships[0].order=null;s.ships[0].location='sea1';
  s.ships[1].order={job:'beachhead',fleet:'landing',province:'coast',readyTurn:0};
  if(mode==='neutral')s.wars=[];
  if(mode==='origin')s.ships[1].location='sea1';
  orderFleet(s,'england',{ships:['a'],job:'sail',zone:'sea0'});resolveFleets(s);
  assert.ok(!s.reports.some(r=>r.kind==='navalBattle'),mode);assert.equal(s.navalSeed,undefined,mode);
 }
});

test('blockade intercepts traffic using its specific port before sailing and preserves an escaping ship at origin',()=>{
 const s=fixture();s.turn=1;s.nations.portugal.capital='port-b';
 s.ships[0].order={job:'blockade',fleet:'a',port:'port-b'};
 s.ships[1].location='home';s.ships[1].aggression=0;
 s.ships[1].order={job:'sail',fleet:'b',sourcePort:'port-b',destination:'sea1',path:['sea0','sea1']};
 resolveFleets(s);
 const ship=s.ships.find(u=>u.id==='b');assert.ok(ship);assert.equal(ship.location,'home');assert.equal(ship.order,null);
 assert.ok(s.reports.some(r=>r.text.includes('interrupted')));
 assert.ok(!s.reports.some(r=>r.text.includes('arrived')));
});

test('blockade ignores sailing ships not entering or leaving its port',()=>{
 const s=fixture();s.ships[0].order={job:'blockade',fleet:'a',port:'port-b'};
 s.ships[1].order={job:'sail',fleet:'b',sourcePort:'other-port',destination:'sea1',path:['sea0','sea1']};
 resolveFleets(s);assert.equal(s.ships[1].location,'sea1');assert.equal(s.navalSeed,undefined);
});

test('patrol can engage a blockade before port traffic and the ordinary patrol pass does not duplicate it',()=>{
 const s=fixture();s.ships[1].order={job:'blockade',fleet:'b',port:'port-b'};resolveFleets(s);
 assert.equal(s.reports.filter(r=>r.kind==='navalBattle'&&r.nation==='england').length,1);
});

test('blockade orders validate enemy port and location, persist through reload, and do not disconnect transport',async()=>{
 const {createGame,command,saveGame,loadGame,transport}=await import('../engine.mjs');
 const {portSeas}=await import('../overseas.mjs');let s=createGame();
 const port=s.nations.portugal.capital,zone=portSeas(s,port)[0],ship=s.ships.find(u=>u.owner==='england');ship.location=zone;
 const action={type:'fleet',job:'blockade',ships:[ship.id],port};
 assert.throws(()=>command(s,'england',action),/enemy port/);s.wars=[['england','portugal']];
 const before=transport(s,'portugal');s=command(s,'england',action);s=loadGame(saveGame(s));
 assert.equal(s.ships.find(u=>u.id===ship.id).order.port,port);assert.deepEqual(transport(s,'portugal'),before);
 assert.throws(()=>command(s,'england',{type:'fleet',job:'sail',ships:[ship.id],zone:'home'}),/already has orders/);
});

test('owned ports are distinct fleet destinations and consume movement entering and leaving',async()=>{
 const {createGame,command,saveGame,loadGame}=await import('../engine.mjs');
 const {fleetMoves,fleetRoute}=await import('../navy.mjs');const {portSeas}=await import('../overseas.mjs');
 let s=createGame();const tile=s.tiles.find(t=>t.owner==='england'&&t.id!==s.nations.england.capital&&portSeas(s,t.id).length);assert.ok(tile);tile.port=true;
 const ship=s.ships.find(u=>u.owner==='england'),zone=portSeas(s,tile.id)[0];ship.location=zone;
 assert.equal(fleetRoute(s,'england',zone,'port:'+tile.id).distance,1);
 assert.ok(fleetMoves(s,[ship]).some(m=>m.zone==='port:'+tile.id));
 s=command(s,'england',{type:'fleet',job:'sail',ships:[ship.id],zone:'port:'+tile.id});resolveFleets(s);s=loadGame(saveGame(s));
 assert.equal(s.ships.find(u=>u.id===ship.id).location,'port:'+tile.id);
 assert.throws(()=>command(s,'england',{type:'fleet',job:'patrol',ships:[ship.id]}),/Sail out/);
 s=command(s,'england',{type:'fleet',job:'sail',ships:[ship.id],zone});assert.equal(s.ships.find(u=>u.id===ship.id).order.sourcePort,tile.id);
 resolveFleets(s);assert.equal(s.ships.find(u=>u.id===ship.id).location,zone);
 assert.equal(fleetRoute(s,'england',zone,'port:'+s.nations.portugal.capital),null);
});

test('idle sea fleets receive temporary defensive patrols without acquiring persistent orders',()=>{
 const s=fixture();s.ships[0].order=null;resolveFleets(s);
 assert.ok(s.reports.some(r=>r.kind==='navalBattle'));
 for(const ship of s.ships)assert.equal(ship.order,null);
});

test('idle fleets at anchor do not defensively patrol adjoining open water',()=>{
 const s=fixture();s.ships[0].location='port:a';s.ships[0].order=null;s.ships[1].order=null;
 resolveFleets(s);assert.equal(s.navalSeed,undefined);assert.equal(s.ships.length,2);
});

test('resolved patrol fleet elimination changes saved war support once; survival retreats do not',async()=>{
 const {warSupportEvent}=await import('../war-support.mjs');let decisive=0;
 for(let seed=1;seed<=20;seed++){
  const s=fixture();s.seed=seed;
  for(const n of Object.values(s.nations)){n.ministers={foreign:0,defence:0};n.warSupport=.5;}
  resolveFleets(s);const reports=s.reports.filter(r=>r.kind==='navalBattle'&&r.nation==='england');
  const expected={england:.5,portugal:.5};
  for(const {result:r} of reports)if(r.winner&&!r.survivors.some(u=>u.owner!==r.winner)){
   decisive++;expected[r.winner]=warSupportEvent(expected[r.winner],0,6);
   const loser=r.winner==='england'?'portugal':'england';expected[loser]=warSupportEvent(expected[loser],0,7);
  }
  for(const id of Object.keys(expected))assert.equal(s.nations[id].warSupport,expected[id]);
  assert.deepEqual(JSON.parse(JSON.stringify(s)).nations,s.nations);
 }
 assert.ok(decisive>0);
});

