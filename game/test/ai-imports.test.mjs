import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,beginTurn,resolveTurn,saveGame,loadGame} from '../engine.mjs';
import {planEconomy} from '../ai.mjs';
function fixture(){const s=createGame();s.ships=s.ships.filter((ship,i,all)=>all.findIndex(u=>u.owner===ship.owner)===i);s.civilians=[];s.minors={};for(const n of Object.values(s.nations)){for(const g of Object.keys(n.stock))n.stock[g]=20;n.orders.trade={bids:[],offers:{}};n.cash=10000;}const n=s.nations.france;n.stock.copper=0;n.stock.bronze=0;n.stock.coal=0;n.stock.steel=0;return s;}
test('AI adds paired industrial inputs only when usable and leaves construction bids first',()=>{
 let s=fixture();let next=planEconomy(s,'france',command);assert.ok(next.nations.france.orders.trade.bids.includes('copper'));assert.ok(!next.nations.france.orders.trade.bids.includes('coal'));
 s.nations.france.known.push('66');next=planEconomy(s,'france',command);assert.ok(next.nations.france.orders.trade.bids.includes('coal'));
 for(const g of ['castIron','lumber','iron','timber','fabric','wool'])s.nations.france.stock[g]=0;
 next=planEconomy(s,'france',command);assert.deepEqual(next.nations.france.orders.trade.bids,['castIron','lumber','iron']);
});
test('AI purchased copper arrives after manufacturing and supports next-turn bronze',()=>{
 let s=fixture();s=command(s,'england',{type:'tradeOrder',good:'copper',quantity:2});s=beginTurn(s);
 const purchase=s.market.inTransit.find(c=>c.buyer==='france'&&c.good==='copper');assert.ok(purchase);assert.ok(purchase.quantity>0);
 assert.equal(s.nations.france.stock.copper,0);assert.equal(s.nations.france.orders.production.bronze,0);
 s=resolveTurn(loadGame(saveGame(s)));assert.ok(s.nations.france.stock.copper>0);assert.equal(s.nations.france.stock.bronze,0);
 s=planEconomy(s,'france',command);const q=s.nations.france.orders.production.bronze;assert.ok(q>0);
 const before={...s.nations.france.stock};s=resolveTurn(s);
 assert.ok(s.nations.france.stock.bronze>=before.bronze+q);
});
test('AI counts purchased ore in transit before accepting another seller',()=>{
 let s=fixture();const merchant=s.ships.find(u=>u.owner==='france');
 for(let i=0;i<3;i++)s.ships.push({...structuredClone(merchant),id:'extra-import-cargo-'+i});
 s=command(s,'england',{type:'tradeOrder',good:'copper',quantity:3});
 s=beginTurn(s);
 const purchases=s.market.inTransit.filter(c=>c.buyer==='france'&&c.good==='copper');
 assert.ok(purchases.length>=2,'exercise more than one seller');
 assert.equal(purchases.reduce((q,c)=>q+c.quantity,0),6);
 assert.equal(s.nations.france.stock.copper,0,'purchases remain in transit');
});

test('missing siege horses are bought from a real seller and arrive after orders',async()=>{
 const {goalPath}=await import('../rules.mjs');
 let s=fixture();s.wars=[['france','spain']];
 const n=s.nations.france;n.known=[...new Set([...n.known,...goalPath('59')])];n.stock.horses=0;n.stock.copper=20;n.stock.bronze=20;
 s=planEconomy(s,'france',command);assert.ok(s.nations.france.orders.trade.bids.includes('horses'));
 s=command(s,'england',{type:'tradeOrder',good:'horses',quantity:3});s=beginTurn(s);
 const purchase=s.market.inTransit.find(c=>c.buyer==='france'&&c.seller==='england'&&c.good==='horses');
 assert.ok(purchase);assert.equal(purchase.quantity,3);assert.equal(s.nations.france.stock.horses,0);
 assert.ok(s.market.deals.some(d=>d.good==='horses'&&d.buyer==='france'&&d.total>0));
 s=resolveTurn(loadGame(saveGame(s)));assert.ok(s.nations.france.stock.horses>=purchase.quantity);
});
