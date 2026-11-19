import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,beginTurn,saveGame,loadGame} from '../engine.mjs';
import {atWar,issueDeclarations} from '../diplomacy.mjs';
import {advanceWarCalls} from '../war-call-phase.mjs';
import {callToWarResponse} from '../call-to-war-response.mjs';
import {recordPeaceRelations,recordAllianceBreakRelations,recordWarRelations} from '../trade-relations.mjs';
const fixture=()=>{const s=createGame({transportModel:'ports'});s.alliances=[['england','france']];return s;};
test('defensive human call pauses the public turn, persists and requires explicit acceptance',()=>{
 let s=command(fixture(),'sweden',{type:'declareWar',target:'france'});s=beginTurn(s);
 assert.equal(s.market,undefined);assert.equal(s.pendingWarCalls[0].recipient,'england');assert.equal(s.pendingWarCalls[0].defensive,true);
 assert.equal(atWar(s,'england','sweden'),false);const turn=s.turn;
 s=loadGame(saveGame(s));assert.throws(()=>command(s,'england',{type:'declareWar',target:'spain'}),/pending diplomatic/);
 assert.throws(()=>command(s,'england',{type:'respondWarCall',accept:1}),/Explicit/);
 assert.throws(()=>command(s,'portugal',{type:'respondWarCall',accept:true}),/Explicit/);
 s=command(s,'england',{type:'respondWarCall',accept:true});s=loadGame(saveGame(s));s=beginTurn(s);
 assert.ok(atWar(s,'england','sweden'));assert.equal(s.turn,turn);assert.equal(s.pendingWarCalls.length,0);
 assert.equal(s.wars.filter(p=>p.includes('england')&&p.includes('sweden')).length,1);
 assert.equal(s.reports.filter(r=>r.warCall&&r.nation==='england').length,1);
});
test('refusal ends the alliance with defensive penalty only; declarations do not recur after reload',()=>{
 for(const defensive of [true,false]){
  let s=fixture();s.relations.england.france=s.relations.france.england=200;
  s=command(s,defensive?'sweden':'france',{type:'declareWar',target:defensive?'france':'sweden'});s=beginTurn(s);
  const expected=structuredClone(s);recordPeaceRelations(expected,'england','france');if(defensive)recordAllianceBreakRelations(expected,'england','france');
  s=command(loadGame(saveGame(s)),'england',{type:'respondWarCall',accept:false});
  assert.deepEqual(s.relations,expected.relations);assert.deepEqual(s.alliances,[]);assert.equal(atWar(s,'england','sweden'),false);
  assert.throws(()=>command(s,'england',{type:'respondWarCall',accept:false}),/Explicit/);
  s=beginTurn(loadGame(saveGame(s)));assert.equal(atWar(s,'england','sweden'),false);
 }
});
test('computer responses issue support declarations and terminate a chain without duplicate wars',()=>{
 const s=fixture();s.player='portugal';s.alliances.push(['sweden','spain']);s.declarations=[{nation:'sweden',target:'france'}];const seen=[];
 advanceWarCalls(s,{evaluate:(_s,recipient,ally,enemy,{defensive})=>{seen.push({recipient,ally,enemy,defensive});return callToWarResponse({recipient,ally,enemy,defensive,accept:true});}});
 assert.deepEqual(seen.slice(0,2),[{recipient:'england',ally:'france',enemy:'sweden',defensive:true},{recipient:'spain',ally:'sweden',enemy:'france',defensive:false}]);
 assert.ok(atWar(s,'england','sweden'));assert.ok(atWar(s,'spain','france'));assert.equal(s.pendingWarCalls.length,0);
 assert.equal(new Set(s.wars.map(p=>[...p].sort().join(':'))).size,s.wars.length);assert.ok(s.wars.length<=15);
});
test('declaring directly against an ally applies breach before war and removes the alliance',()=>{
 const s=fixture();s.relations.england.france=s.relations.france.england=200;const expected=structuredClone(s);
 recordAllianceBreakRelations(expected,'england','france');expected.wars=[['england','france']];recordWarRelations(expected,'england','france');
 s.declarations=[{nation:'england',target:'france'}];issueDeclarations(s);assert.deepEqual(s.alliances,[]);assert.deepEqual(s.relations,expected.relations);
});
test('malformed persisted war calls are rejected',()=>{
 for(const calls of [[{recipient:'england',ally:'england',enemy:'france',defensive:true,turn:0}],[{recipient:'england',ally:'france',enemy:'sweden',defensive:'true',turn:0}]]){
  const s=fixture();s.pendingWarCalls=calls;assert.throws(()=>loadGame(JSON.stringify(s)),/pending war calls/);
 }
});

test('an expired saved human call is dismissed without starting a new war',()=>{
 let s=fixture();s.pendingDiplomacy={turn:s.turn,reports:[],peaceIssued:false};s.pendingWarCalls=[{recipient:'england',ally:'france',enemy:'sweden',defensive:true,turn:s.turn}];
 s=command(loadGame(saveGame(s)),'england',{type:'respondWarCall',accept:true});assert.equal(s.pendingWarCalls.length,0);assert.equal(atWar(s,'england','sweden'),false);assert.ok(s.reports.some(r=>r.warCallExpired));
});
