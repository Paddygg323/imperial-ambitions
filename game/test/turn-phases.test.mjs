import {openMarket,nextOffer} from '../trade.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,resolveTurn,finishTurnEconomy,saveGame,loadGame} from '../engine.mjs';
import {provinceAdjacency} from '../world.mjs';
import {startLandBattle,commandLandBattle,finishLandBattle} from '../campaign-battle.mjs';
import {chooseBattleAction} from '../battle-ai.mjs';
function fixture(defended=true){
 let s=createGame();const adj=provinceAdjacency(s);
 const source=s.provinces.find(p=>p.owner==='england'&&[...adj[p.id]].some(id=>s.provinces.find(q=>q.id===id).owner!=='england'));
 const target=s.provinces.find(p=>p.owner!=='england'&&adj[source.id].has(p.id));target.fort=0;s.wars=[['england',target.owner]];
 s.armies=[{id:'attacker',owner:'england',province:source.id,type:'regular',hp:100,experience:0,order:null}];
 if(defended)s.armies.push({id:'defender',owner:target.owner,province:target.id,type:'pikeman',hp:100,experience:0,order:null});
 s=command(s,'england',{type:'production',recipe:'lumber',quantity:1});
 s=command(s,'england',{type:'recruitWorker',quantity:1});
 s=command(s,'england',{type:'army',units:['attacker'],job:'attack',province:target.id});return s;
}
test('combat suspends economy/year; legal battle and reload complete production once',()=>{
 const original=fixture(),lumber=original.nations.england.stock.lumber,workers=original.nations.england.workers.length;
 let s=resolveTurn(original);assert.equal(s.turnPhase,'combat');assert.equal(s.turn,0);assert.equal(s.year,1500);
 assert.equal(s.nations.england.stock.lumber,lumber);assert.equal(s.nations.england.workers.length,workers);
 assert.throws(()=>finishTurnEconomy(s),/Resolve pending/);
 assert.throws(()=>command(s,'england',{type:'production',recipe:'lumber',quantity:0}),/Resolve pending/);
 s=startLandBattle(loadGame(saveGame(s)));
 for(let step=0;s.activeLandBattle.battle.phase!=='finished'&&step<700;step++){
  const b=s.activeLandBattle.battle;
  const side=b.phase==='deployment'?(b.ready[0]?1:0):b.activeSide;
  const nation=side===0?b.attacker:b.defender;
  s=commandLandBattle(s,nation,chooseBattleAction(b,nation));
 }
 assert.equal(s.activeLandBattle.battle.phase,'finished');s=loadGame(saveGame(s));
 assert.equal(s.nations.england.stock.lumber,lumber);
 s=finishLandBattle(s);assert.equal(s.turnPhase,undefined);assert.equal(s.turn,1);assert.equal(s.year,1502);
 assert.equal(s.nations.england.stock.lumber,lumber+1);assert.equal(s.nations.england.workers.length,workers+1);
 assert.equal(s.reports.filter(r=>r.nation==='england'&&r.kind==='production').length,1);
 assert.throws(()=>finishTurnEconomy(loadGame(saveGame(s))),/No turn economy/);
});
test('unopposed occupation also finishes waiting economy exactly once',()=>{
 const original=fixture(false);let s=resolveTurn(original);
 assert.equal(s.turn,0);assert.equal(s.turnPhase,'combat');
 s=startLandBattle(loadGame(saveGame(s)));assert.equal(s.turn,1);assert.equal(s.turnPhase,undefined);
 const occupation=s.reports.findIndex(r=>r.occupation),production=s.reports.findIndex(r=>r.kind==='production');
 assert.ok(occupation>=0&&production>occupation);
 assert.equal(s.nations.england.stock.lumber,original.nations.england.stock.lumber+1);
 assert.throws(()=>finishTurnEconomy(s),/No turn economy/);
});


test('purchased inputs survive combat reload but cannot feed manufacturing until next turn',()=>{
 let s=fixture(false);
 for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
 // A standing lumber order can outlive its supply from the preceding turn.
 s.nations.england.stock.timber=0;s.nations.england.orders.trade.bids=['timber'];
 s.nations.france.orders.trade.offers.timber=2;
 for(const t of s.tiles)if(t.owner==='england'&&t.resource==='timber')t.level=0;
 const initialLumber=s.nations.england.stock.lumber;
 s.market=openMarket(s);s=command(s,'england',{type:'tradeAccept',quantity:2,stop:true});
 assert.equal(s.nations.england.stock.timber,0);assert.equal(s.market.inTransit[0].quantity,2);
 s=resolveTurn(loadGame(saveGame(s)));assert.equal(s.turnPhase,'combat');assert.equal(s.tradeDeliveries[0].quantity,2);
 s=startLandBattle(loadGame(saveGame(s)));
 assert.equal(s.nations.england.stock.lumber,initialLumber,'purchased timber is not available during manufacture');
 assert.equal(s.nations.england.stock.timber,2);assert.deepEqual(s.tradeDeliveries,[]);
 assert.equal(s.reports.find(r=>r.nation==='england'&&r.kind==='production').made,0);
 assert.equal(s.reports.filter(r=>r.nation==='england'&&r.kind==='tradeDelivery').length,1);
 s=loadGame(saveGame(s));s.nations.england.orders.trade.bids=[];s.market=openMarket(s);
 // Complete empty market using the public iterator, as the app does.
 assert.equal(nextOffer(s,s.market),null);s=resolveTurn(s);
 assert.equal(s.nations.england.stock.lumber,initialLumber+1);assert.equal(s.nations.england.stock.timber,0);
 assert.equal(s.reports.filter(r=>r.nation==='england'&&r.kind==='tradeDelivery').length,0);
});

test('regular ship repairs precede combat and cannot repeat after battle reload',()=>{
 let s=fixture(false);const ship=s.ships.find(u=>u.owner==='england'),id=ship.id;ship.hp=1;
 s=resolveTurn(s);assert.equal(s.turnPhase,'combat');assert.equal(s.ships.find(u=>u.id===id).hp,7);
 assert.equal(s.reports.filter(r=>r.kind==='shipRepair'&&r.ship===id).length,1);
 s=loadGame(saveGame(s));assert.throws(()=>resolveTurn(s),/Resolve pending/);
 s=startLandBattle(s);assert.equal(s.turn,1);assert.equal(s.ships.find(u=>u.id===id).hp,7);
 assert.equal(s.reports.filter(r=>r.kind==='shipRepair'&&r.ship===id).length,1);
});
