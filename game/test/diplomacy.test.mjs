import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,command,beginTurn,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {atWar,issueDeclarations} from '../diplomacy.mjs';
import {openMarket,nextOffer} from '../trade.mjs';
import {provinceAdjacency} from '../world.mjs';
import {planLandAttack} from '../land-attack.mjs';

test('declaration is cancellable and saved, with no immediate war or attack',()=>{
 let s=createGame();const adj=provinceAdjacency(s);
 const source=s.provinces.find(p=>p.owner==='england'&&[...adj[p.id]].some(id=>s.provinces.find(q=>q.id===id).owner!=='england'));
 const target=s.provinces.find(p=>p.owner!=='england'&&adj[source.id].has(p.id));
 s.armies=[{id:'a',owner:'england',province:source.id,type:'pikeman',hp:100,experience:0,order:null}];
 const before=structuredClone(s);
 s=command(s,'england',{type:'declareWar',target:target.owner});
 assert.deepEqual(before.declarations,undefined);assert.equal(atWar(s,'england',target.owner),false);
 assert.throws(()=>planLandAttack(s,'england',['a'],target.id),/Declare war/);
 s=loadGame(saveGame(s));assert.equal(s.declarations.length,1);
 const cancelled=command(s,'england',{type:'declareWar',target:target.owner,cancel:true});
 assert.equal(cancelled.declarations.length,0);assert.equal(s.declarations.length,1);
 const ended=resolveTurn(s);assert.ok(atWar(ended,'england',target.owner));
 assert.equal(planLandAttack(ended,'england',['a'],target.id).province,target.id);
 assert.ok(ended.reports.some(r=>r.nation===target.owner&&r.kind==='diplomacy'));
 assert.equal(ended.armies[0].province,source.id);
});
test('war stops trade before the end-turn market; pending news survives reload and resolution',()=>{
 let s=createGame();for(const n of Object.values(s.nations))n.orders.trade={bids:[],offers:{}};
 s.nations.france.orders.trade.offers.fabric=2;s.nations.england.orders.trade.bids=['fabric'];
 assert.equal(nextOffer(s,openMarket(s)).seller,'france');
 s=command(s,'england',{type:'declareWar',target:'france'});
 s=beginTurn(s);assert.ok(atWar(s,'france','england'));
 assert.ok(s.market.offers.filter(o=>o.seller==='france').every(o=>!o.buyers.includes('england')));
 assert.equal(s.market.diplomacy.length,2);
 s=loadGame(saveGame(s));assert.equal(beginTurn(s).market.diplomacy.length,2);
 // Resolve any other human offers before completing this market.
 for(let o=nextOffer(s,s.market);o;o=nextOffer(s,s.market))s=command(s,'england',{type:'tradeAccept',quantity:0});
 s=resolveTurn(s);assert.equal(s.reports.filter(r=>r.kind==='diplomacy').length,2);
 assert.equal(s.wars.length,1);assert.deepEqual(issueDeclarations(s),[]);
});
test('invalid and duplicate declarations fail without changing caller state',()=>{
 const s=createGame();for(const target of ['england','missing'])assert.throws(()=>command(s,'england',{type:'declareWar',target}));
 const pending=command(s,'england',{type:'declareWar',target:'france'});
 assert.throws(()=>command(pending,'england',{type:'declareWar',target:'france'}),/already pending/);
 const ended=beginTurn(pending);assert.throws(()=>command(ended,'england',{type:'declareWar',target:'spain'}),/Finish/);
 assert.equal(s.declarations,undefined);
});
test('simultaneous reciprocal declarations establish one symmetric war',()=>{
 let s=createGame();s=command(s,'england',{type:'declareWar',target:'france'});s=command(s,'france',{type:'declareWar',target:'england'});
 assert.equal(issueDeclarations(s).length,2);assert.equal(s.wars.length,1);
 assert.ok(atWar(s,'england','france'));assert.ok(atWar(s,'france','england'));
});

test('minor peace persists until diplomacy, preserves territory and cancels only hostile orders against that country',()=>{
 let s=createGame();s.wars=[['england','scotland'],['england','france']];
 const target=s.provinces.find(p=>p.owner==='scotland'),other=s.provinces.find(p=>p.owner==='france');
 const home=s.tiles.find(t=>t.id===s.nations.england.capital).province;
 s.armies.push({id:'peace-attacker',owner:'england',province:home,type:'pikeman',hp:100,experience:0,order:{job:'attack',province:target.id}});
 s.armies.push({id:'other-war',owner:'england',province:home,type:'pikeman',hp:100,experience:0,order:{job:'attack',province:other.id}});
 const ship=s.ships.find(u=>u.owner==='england');ship.order={job:'beachhead',province:target.id,readyTurn:0};
 const territory=s.provinces.map(p=>[p.id,p.owner]);
 s=command(s,'england',{type:'offerPeace',target:'scotland'});assert.ok(atWar(s,'england','scotland'));
 const cancelled=command(s,'england',{type:'offerPeace',target:'scotland',cancel:true});assert.equal(cancelled.peaceOffers.length,0);assert.ok(atWar(cancelled,'england','scotland'));
 assert.throws(()=>command(s,'england',{type:'offerPeace',target:'scotland'}),/already pending/);
 s=loadGame(saveGame(s));s=beginTurn(s);
 assert.ok(!atWar(s,'england','scotland'));assert.ok(atWar(s,'england','france'));
 assert.deepEqual(s.provinces.map(p=>[p.id,p.owner]),territory);
 assert.equal(s.armies.find(u=>u.id==='peace-attacker').order,null);assert.equal(s.armies.find(u=>u.id==='other-war').order.job,'attack');
 assert.equal(s.ships.find(u=>u.id===ship.id).order,null);
 const news=s.market.diplomacy.filter(r=>r.peace);assert.equal(news.length,2);assert.ok(news.some(r=>r.nation==='england'));assert.ok(news.some(r=>r.nation==='scotland'));
 assert.equal(beginTurn(loadGame(saveGame(s))).market.diplomacy.filter(r=>r.peace).length,2);
 assert.equal(s.peaceOffers.length,0);
});

test('minor peace rejects unsupported or invalid targets and malformed saved offers',()=>{
 const s=createGame();s.wars=[['england','france']];
 for(const target of ['england','france','missing','scotland'])assert.throws(()=>command(s,'england',{type:'offerPeace',target}));
 assert.equal(s.peaceOffers,undefined);
 const valid=structuredClone(s);valid.wars.push(['england','scotland']);
 const pending=command(valid,'england',{type:'offerPeace',target:'scotland'});
 pending.peaceOffers.push({...pending.peaceOffers[0]});assert.throws(()=>saveGame(pending),/Invalid peace offer/);
});
