import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {declarationRelations} from '../war-relations.mjs';
test('declaration relations match720 native country/consortium/friendship/boundary cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-war-relations-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,720);
 for(const c of audit.cases){
  const matrix=Array.from({length:22},(_,a)=>Array.from({length:22},(_,b)=>a===b?255:90));
  for(const [a,b,r] of [[0,c.victim,c.prior],[0,c.observer,c.withAggressor],[c.victim,c.observer,c.withVictim]])matrix[a][b]=matrix[b][a]=r;
  assert.deepEqual(declarationRelations(matrix,0,c.victim)[0],c.result,JSON.stringify(c));
 }
});

test('issued declaration applies reactions and office closure exactly once; cancellation does not',async()=>{
 const {createGame,command,saveGame,loadGame}=await import('../engine.mjs');const {issueDeclarations,atWar}=await import('../diplomacy.mjs');
 let s=createGame();s=command(s,'england',{type:'declareWar',target:'ireland'});
 assert.equal(s.relations.england.ireland,90);assert.equal(atWar(s,'england','ireland'),false);
 s=command(s,'england',{type:'declareWar',target:'ireland',cancel:true});issueDeclarations(s);assert.equal(s.relations.england.ireland,90);
 s.nations.england.consulates=['ireland'];s.nations.england.embassies=['ireland'];
 s=command(s,'england',{type:'declareWar',target:'ireland'});issueDeclarations(s);
 assert.equal(s.relations.england.ireland,40);assert.equal(s.relations.ireland.england,40);
 assert.ok(s.relations.england.switzerland<90,'other European minors object to attack on consortium member');
 assert.equal(s.nations.england.tradePolicies.ireland,300);assert.deepEqual(s.nations.england.consulates,[]);assert.deepEqual(s.nations.england.embassies,[]);
 const relations=structuredClone(s.relations);s=loadGame(saveGame(s));issueDeclarations(s);assert.deepEqual(s.relations,relations);
});
