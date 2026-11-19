import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {campaignPeaceProposals} from '../campaign-peace-seeking.mjs';
import {recordWarDeclaration} from '../war-history.mjs';
test('saved AI peace proposals use recorded wars and stagger human offers without issuing orders',()=>{
 let s=createGame({transportModel:'ports'});s.wars=[['france','england'],['france','spain']];
 for(const [a,b] of s.wars)recordWarDeclaration(s,a,b);s.nations.france.warSupport=Math.fround(.0001);
 assert.deepEqual(campaignPeaceProposals(s,'france'),[]);
 s.turn=1;s.year=1502;assert.deepEqual(campaignPeaceProposals(s,'france'),['spain']);
 s.turn=6;s.year=1512;s=loadGame(saveGame(s));const before=JSON.stringify(s);
 assert.deepEqual(campaignPeaceProposals(s,'france'),['england','spain']);assert.equal(JSON.stringify(s),before);
 s.nations.spain.alive=false;assert.deepEqual(campaignPeaceProposals(s,'france'),['england']);
});
test('human control and unknown legacy war dates cannot produce autonomous peace proposals',()=>{
 const s=createGame({transportModel:'ports'});s.wars=[['france','england']];
 assert.throws(()=>campaignPeaceProposals(s,'france'),/Recorded declaration/);
 assert.throws(()=>campaignPeaceProposals(s,'england'),/computer Great Power/);
});
