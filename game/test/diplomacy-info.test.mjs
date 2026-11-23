import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,saveGame} from '../engine.mjs';
import {majorPowerRelations,nationExports} from '../diplomacy-info.mjs';
import {transport} from '../economy.mjs';
import {TRADE_GOODS} from '../trade.mjs';

test('all six major powers use the selected nation’s individual relations; ties stay visible',()=>{
 const s=createGame();for(const id of Object.keys(s.nations))s.relations.italy[id]=90;
 s.relations.italy.france=220;s.relations.italy.portugal=10;
 const before=saveGame(s),rows=majorPowerRelations(s,'italy');
 assert.equal(rows.length,6);assert.equal(new Set(rows.map(n=>n.id)).size,6);
 assert.equal(rows.find(n=>n.id==='france').position,220/255*100);
 assert.equal(rows.find(n=>n.id==='portugal').description,'Hostile');
 assert.equal(rows.filter(n=>n.value===90).length,4);
 assert.equal(saveGame(s),before);
});
test('minor exports come from connected production or this market’s remaining supply',()=>{
 const s=createGame(),id='scotland',incoming=transport(s,id).incoming,before=saveGame(s);
 const list=nationExports(s,id);assert.equal(list.source,'production');
 assert.deepEqual(list.goods,TRADE_GOODS.filter(g=>incoming[g]>0).map(g=>({good:g,quantity:incoming[g]})).sort((a,b)=>b.quantity-a.quantity||a.good.localeCompare(b.good)).slice(0,4));
 s.minors[id].stock.iron=999;assert.deepEqual(nationExports(s,id),list,'Purchased stock cannot invent an export');
 s.minors[id].stock.iron=JSON.parse(before).minors[id].stock.iron;assert.equal(saveGame(s),before);
 s.minors[id].exportTurn=s.turn;s.minors[id].exportStock={timber:2,iron:0};
 assert.deepEqual(nationExports(s,id),{source:'market',goods:[{good:'timber',quantity:2}]});
});
test('major stocks alone are not exports; report fallback does not count buyer copies twice',()=>{
 const s=createGame(),n=s.nations.france;n.stock.iron=999;n.orders.trade={bids:[],offers:{}};
 assert.deepEqual(nationExports(s,'france'),{source:'offers',goods:[]});
 n.stock.paper=10;n.orders.trade.offers={paper:2};
 assert.deepEqual(nationExports(s,'france').goods,[{good:'paper',quantity:2}]);
 n.stock.paper=1;assert.deepEqual(nationExports(s,'france').goods,[{good:'paper',quantity:1}]);n.stock.paper=10;
 const ships=s.ships;s.ships=s.ships.filter(u=>u.owner!=='france');assert.deepEqual(nationExports(s,'france').goods,[],'No merchant capacity means no current offer');s.ships=ships;
 n.orders.trade.offers={};s.reports=[{nation:'france',kind:'trade',seller:'france',buyer:'england',good:'fabric',quantity:3},{nation:'england',kind:'trade',seller:'france',buyer:'england',good:'fabric',quantity:3}];
 assert.deepEqual(nationExports(s,'france'),{source:'recent',goods:[{good:'fabric',quantity:3}]});
 const before=saveGame(s);nationExports(s,'france');assert.equal(saveGame(s),before);
});
test('unknown overseas nations do not reveal export information',()=>{
 const s=createGame();assert.deepEqual(nationExports(s,'cherokee'),{source:'unknown',goods:[]});
});
