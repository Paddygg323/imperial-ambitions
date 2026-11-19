import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allianceBreakRelations} from '../war-relations.mjs';
import {createGame,loadGame,saveGame} from '../engine.mjs';
import {recordAllianceBreakRelations,tradeRelation} from '../trade-relations.mjs';

test('broken alliance relationship changes match360 original executions including observer penalties',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-alliance-break-relations-audit.json',import.meta.url)));
 for(const c of audit.cases){
  const matrix=Array.from({length:22},(_,a)=>Array.from({length:22},(_,b)=>a===b?255:90));
  for(const [a,b,value] of [[0,c.victim,c.prior],[0,c.observer,c.withAggressor],[c.victim,c.observer,c.withVictim]])matrix[a][b]=matrix[b][a]=value;
  const before=JSON.stringify(matrix),result=allianceBreakRelations(matrix,0,c.victim);
  assert.deepEqual(result[0],c.result,JSON.stringify(c));
  assert.equal(JSON.stringify(matrix),before);
  for(let i=0;i<22;i++)assert.equal(result[0][i],result[i][0]);
 }
});

test('campaign alliance-break penalty changes bilateral and observer opinions and persists',()=>{
 let s=createGame();s.relations.england.france=s.relations.france.england=200;
 s.relations.england.spain=s.relations.spain.england=150;
 s.relations.france.spain=s.relations.spain.france=200;
 const orders=JSON.stringify(s.nations.england.orders);
 recordAllianceBreakRelations(s,'england','france');
 assert.equal(tradeRelation(s,'england','france'),90);
 assert.equal(tradeRelation(s,'england','spain'),95);
 assert.equal(JSON.stringify(s.nations.england.orders),orders);
 s=loadGame(saveGame(s));assert.equal(tradeRelation(s,'france','england'),90);assert.equal(tradeRelation(s,'spain','england'),95);
});
