import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,saveGame,loadGame,transport,beginTurn,resolveTurn,command} from '../engine.mjs';
import {setTransportLink} from '../transport-links.mjs';
import {worldIndex,nearby} from '../world.mjs';
import {openMarket,nextOffer,acceptOffer,setTradeOrder,deliverTrade,settleTradeInterception} from '../trade.mjs';
function fixture(){
 const s=createGame(),ix=worldIndex(s);
 const m=Object.values(s.minors).find(m=>s.provinces.some(p=>p.owner===m.id&&p.old)&&nearby(ix.get(m.capital),ix).some(t=>t.owner===m.id));
 s.minors={[m.id]:m};for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
 for(const t of s.tiles)if(t.owner===m.id)t.level=0;
 const resource=nearby(ix.get(m.capital),ix).find(t=>t.owner===m.id);Object.assign(resource,{resource:'timber',level:3});
 setTradeOrder(s,'england',{good:'timber',bid:true});return {s,m,resource};
}
test('minor export uses connected production, buyer cash/cargo and delayed delivery',()=>{
 const {s,m}=fixture(),market=openMarket(s),offer=nextOffer(s,market),cash=s.nations.england.cash,minorCash=m.cash,stock=s.nations.england.stock.timber,cargo=market.cargo.england;
 assert.equal(offer.seller,m.id);assert.equal(offer.good,'timber');assert.equal(offer.maximum,3);assert.equal(offer.carrier,'england');
 acceptOffer(s,market,'england',3);assert.equal(m.exportStock.timber,0);assert.equal(m.cash,minorCash+300);assert.equal(s.nations.england.cash,cash-300);assert.equal(market.cargo.england,cargo-3);assert.equal(s.nations.england.stock.timber,stock);
 s.tradeDeliveries=market.inTransit;const loaded=loadGame(saveGame(s));deliverTrade(loaded,'england',[]);assert.equal(loaded.nations.england.stock.timber,stock+3);
 assert.equal(nextOffer(loaded,openMarket(loaded)),null,'reopening market does not manufacture another batch');
 loaded.turn++;loaded.year+=2;assert.equal(nextOffer(loaded,openMarket(loaded)).maximum,3);
});
test('purchased minor goods are not reoffered; undeveloped and disconnected sources supply nothing',()=>{
 const {s,m,resource}=fixture();resource.level=0;m.stock.timber=500;
 assert.equal(nextOffer(s,openMarket(s)),null);assert.equal(m.exportStock.timber,0);
 resource.level=3;resource.x+=100;resource.id=`${resource.x},${resource.y}`;s.turn++;assert.equal(nextOffer(s,openMarket(s)),null);
});
test('minor cancellation restores export pool, loss does not; exhausted buyer cargo prevents sale',()=>{
 for(const outcome of ['canc','lost']){
  const {s,m}=fixture(),market=openMarket(s),cash=s.nations.england.cash,minorCash=m.cash;
  acceptOffer(s,market,'england',2);s.tradeDeliveries=market.inTransit;
  settleTradeInterception(s,s.tradeDeliveries[0],outcome);
  assert.equal(m.cash,minorCash);assert.equal(m.exportStock.timber,outcome==='canc'?3:1);assert.equal(s.nations.england.cash,outcome==='canc'?cash:cash-200);
 }
 const {s}=fixture();s.ships=s.ships.filter(u=>u.owner!=='england');assert.equal(nextOffer(s,openMarket(s)),null);
});
test('minor exports reject invalid persisted production pools',()=>{
 const {s,m}=fixture();openMarket(s);m.exportStock.timber=-1;assert.throws(()=>saveGame(s),/minor exports/);
});
test('minor transport uses the audited32 network layouts and global road discovery',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-network-collection-audit.json',import.meta.url)));
 for(const c of audit.cases){
  const s=createGame();s.transportLinks={};s.tiles=c.nodes.map(n=>({id:`${n.x},${n.y}`,x:n.x,y:n.y,owner:'minor',province:'home',resource:n.level?'iron':null,level:n.level,port:false}));
  s.minors={minor:{id:'minor',capital:s.tiles[c.root].id}};
  for(const n of Object.values(s.nations))n.known=[];if(c.roadCapacity===2)s.nations.france.known=['45'];
  for(const [a,,b,kind] of c.edges)if(kind)setTransportLink(s,s.tiles[a].id,s.tiles[b].id,kind);
  assert.equal(transport(s,'minor').incoming.iron,c.quantity);
 }
});

test('undiscovered tribes and wartime minor sellers are excluded',()=>{
 const {s,m}=fixture();for(const p of s.provinces)if(p.owner===m.id)p.old=false;
 const hidden=new Set(s.tiles.filter(t=>t.owner===m.id).map(t=>t.id));s.nations.england.revealed=s.nations.england.revealed.filter(id=>!hidden.has(id));
 assert.equal(nextOffer(s,openMarket(s)),null);
 s.nations.england.revealed.push(m.capital);assert.ok(nextOffer(s,openMarket(s)));
 s.wars=[['england',m.id]];assert.equal(nextOffer(s,openMarket(s)),null);
});

test('minor timber purchase feeds next-turn manufacturing in a real campaign',()=>{
 let {s,m}=fixture();m.tradePreference={england:100000};s.nations.england.stock.timber=0;
 for(const t of s.tiles)if(t.owner==='england'&&t.resource==='timber')t.level=0;
 const lumber=s.nations.england.stock.lumber;
 s=beginTurn(s);while(nextOffer(s,s.market)?.seller!==m.id&&nextOffer(s,s.market))s=command(s,'england',{type:'tradeAccept',quantity:0});assert.equal(nextOffer(s,s.market).seller,m.id);
 s=command(s,'england',{type:'tradeAccept',quantity:3,stop:true});
 while(nextOffer(s,s.market))s=command(s,'england',{type:'tradeAccept',quantity:0,stop:true});
 s=resolveTurn(s);assert.equal(s.nations.england.stock.timber,3);assert.equal(s.nations.england.stock.lumber,lumber);
 s=loadGame(saveGame(s));s=command(s,'england',{type:'production',recipe:'lumber',quantity:1});
 s=beginTurn(s);while(nextOffer(s,s.market))s=command(s,'england',{type:'tradeAccept',quantity:0,stop:true});
 s=resolveTurn(s);assert.equal(s.nations.england.stock.timber,1);assert.equal(s.nations.england.stock.lumber,lumber+1);
});
