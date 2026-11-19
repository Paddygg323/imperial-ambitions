import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,loadGame,saveGame} from '../engine.mjs';import {campaignAllianceProposalDecision} from '../campaign-alliance-proposal-decision.mjs';
test('live proposal evaluator uses persisted forecasts, relations and ministers without mutation',()=>{
 const s=loadGame(saveGame(createGame({transportModel:'ports'}))),before=JSON.stringify(s);
 const r=campaignAllianceProposalDecision(s,'france','england');assert.equal(typeof r.accepted,'boolean');assert.equal(r.input.counter,s.turn);assert.equal(r.active.length,6);assert.equal(JSON.stringify(s),before);
});
test('proposer war blocks alliance unless recipient already fights that power; minor war does not block',()=>{
 const s=createGame({transportModel:'ports'});s.wars=[['england','sweden']];
 assert.deepEqual(campaignAllianceProposalDecision(s,'france','england'),{accepted:false,blocked:true});
 s.wars.push(['france','sweden']);assert.equal(campaignAllianceProposalDecision(s,'france','england').blocked,false);
 s.wars=[['england','scotland']];assert.equal(campaignAllianceProposalDecision(s,'france','england').blocked,false);
 assert.throws(()=>campaignAllianceProposalDecision(s,'france','england',{strengths:{}}),/Verified/);
});
