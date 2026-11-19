import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,command,saveGame,loadGame} from '../engine.mjs';
import {issueDeclarations,issueMinorPeace} from '../diplomacy.mjs';
import {warDeclarationTurn} from '../war-history.mjs';
test('declaration date records issuance, survives reload and reciprocal orders, and resets after peace',()=>{
 let s=createGame();s.turn=4;
 s=command(s,'england',{type:'declareWar',target:'scotland'});
 assert.equal(warDeclarationTurn(s,'england','scotland'),undefined);
 issueDeclarations(s);assert.equal(warDeclarationTurn(s,'scotland','england'),4);
 s=loadGame(saveGame(s));s.turn=5;issueDeclarations(s);assert.equal(warDeclarationTurn(s,'england','scotland'),4);
 s=command(s,'england',{type:'offerPeace',target:'scotland'});issueMinorPeace(s);assert.equal(warDeclarationTurn(s,'england','scotland'),undefined);
 s=command(s,'england',{type:'declareWar',target:'scotland'});issueDeclarations(s);assert.equal(warDeclarationTurn(s,'england','scotland'),5);
 s=command(s,'england',{type:'declareWar',target:'france'});s=command(s,'france',{type:'declareWar',target:'england'});issueDeclarations(s);
 assert.equal(warDeclarationTurn(s,'france','england'),5);assert.equal(s.wars.filter(w=>w.includes('france')).length,1);
});
test('older wars retain unknown dates and corrupt dates are rejected',()=>{
 const s=createGame();s.wars=[['england','france']];
 assert.equal(warDeclarationTurn(loadGame(saveGame(s)),'england','france'),undefined);
 for(const dates of [[],null,{'england:france':-1},{'england:france':1},{'england:france':.5},{'france:england':0},{'england:spain':0}]){
  s.warDates=dates;assert.throws(()=>saveGame(s),/Invalid war dates/);
 }
});
