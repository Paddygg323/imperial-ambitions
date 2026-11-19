import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command} from '../engine.mjs';
import {planEconomy} from '../ai.mjs';
import {strategicRawExportLimit,exportReserve} from '../ai-exports.mjs';
test('all starting Great Powers keep scarce iron and timber rather than dumping starting stocks',()=>{
 const s=createGame({transportModel:'ports'});
 for(const id of Object.keys(s.nations).filter(id=>id!==s.player)){
  const next=planEconomy(s,id,command),offers=next.nations[id].orders.trade.offers;
  assert.equal(offers.iron??0,0,id+' iron');assert.equal(offers.timber??0,0,id+' timber');
 }
});
test('raw exports require covered domestic needs and a recurring surplus',()=>{
 const n=createGame().nations.france;n.orders.production={};
 Object.assign(n.stock,{iron:100,timber:100,castIron:0,lumber:0,paper:0});let r=exportReserve(n);
 assert.equal(strategicRawExportLimit(n,'iron',{iron:10},r),0);
 Object.assign(n.stock,{castIron:10,lumber:10,paper:5});
 assert.equal(strategicRawExportLimit(n,'iron',{iron:0},r),0);
 assert.equal(strategicRawExportLimit(n,'timber',{timber:3},r),3);
 n.orders.production.lumber=1;assert.equal(strategicRawExportLimit(n,'timber',{timber:3},r),1);
});
