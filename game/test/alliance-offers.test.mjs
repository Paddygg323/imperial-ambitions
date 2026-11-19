import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,beginTurn,saveGame,loadGame} from '../engine.mjs';
import {atWar} from '../diplomacy.mjs';import {campaignAllianceProposalDecision} from '../campaign-alliance-proposal-decision.mjs';
const fixture=()=>createGame({transportModel:'ports'});
test('player alliance offer is cancellable, saved and evaluated using live AI inputs at end turn',()=>{
 let s=fixture();const expected=campaignAllianceProposalDecision(s,'france','england');
 s=command(s,'england',{type:'offerAlliance',target:'france'});assert.equal(s.alliances,undefined);
 assert.throws(()=>command(s,'england',{type:'offerAlliance',target:'france'}),/already pending/);
 assert.deepEqual(command(s,'england',{type:'offerAlliance',target:'france',cancel:true}).allianceOffers,[]);
 s=beginTurn(loadGame(saveGame(s)));assert.equal((s.alliances??[]).some(p=>p.includes('england')&&p.includes('france')),expected.accepted);
 assert.equal(s.market.diplomacy.filter(r=>r.allianceAccepted||r.allianceRejected).length,2);
 const before=JSON.stringify(s);assert.equal(JSON.stringify(beginTurn(loadGame(saveGame(s)))),before);
});
test('human receives own alliance decision and acceptance joins existing proposer wars only after consent',()=>{
 let s=fixture();s=command(s,'france',{type:'declareWar',target:'sweden'});s=command(s,'france',{type:'offerAlliance',target:'england'});s=beginTurn(s);
 assert.equal(s.market,undefined);assert.equal(s.incomingAlliances.length,1);assert.equal(atWar(s,'england','sweden'),false);
 assert.throws(()=>command(s,'england',{type:'respondAlliance',proposer:'france',accept:1}),/Explicit/);
 assert.throws(()=>command(s,'france',{type:'respondAlliance',proposer:'france',accept:true}),/Explicit/);
 s=command(loadGame(saveGame(s)),'england',{type:'respondAlliance',proposer:'france',accept:true});
 assert.deepEqual(s.alliances,[['england','france']]);assert.equal(atWar(s,'england','sweden'),false);
 s=beginTurn(loadGame(saveGame(s)));assert.ok(atWar(s,'england','sweden'));assert.equal(s.incomingAlliances.length,0);assert.ok(s.market);
 assert.equal(s.market.diplomacy.filter(r=>r.allianceAccepted).length,2);assert.equal(s.turn,0);
});
test('human rejection preserves relations and cannot replay after reload',()=>{
 let s=command(fixture(),'france',{type:'offerAlliance',target:'england'});s=beginTurn(s);const relations=structuredClone(s.relations);
 s=command(s,'england',{type:'respondAlliance',proposer:'france',accept:false});assert.deepEqual(s.relations,relations);assert.equal(s.alliances,undefined);
 s=loadGame(saveGame(s));assert.throws(()=>command(s,'england',{type:'respondAlliance',proposer:'france',accept:true}),/No pending/);
 s=beginTurn(s);assert.equal(s.market.diplomacy.filter(r=>r.allianceRejected).length,2);
});
test('reciprocal recorded proposals accept without an additional prompt and do not duplicate treaty',()=>{
 let s=fixture();s=command(s,'england',{type:'offerAlliance',target:'france'});s=command(s,'france',{type:'offerAlliance',target:'england'});s=beginTurn(s);
 assert.equal(s.alliances.length,1);assert.equal(s.incomingAlliances?.length??0,0);assert.ok(s.market);
});
test('invalid and malformed alliance offers cannot bypass diplomatic constraints',()=>{
 const s=fixture();assert.throws(()=>command(s,'england',{type:'offerAlliance',target:'scotland'}),/surviving Great Power/);
 s.wars=[['england','france']];assert.throws(()=>command(s,'england',{type:'offerAlliance',target:'france'}),/peaceful/);
 for(const field of ['allianceOffers','incomingAlliances']){const x=fixture();x[field]=[{nation:'england',proposer:'france',target:'england',turn:-1}];assert.throws(()=>loadGame(JSON.stringify(x)),/alliance offers/);}
});
