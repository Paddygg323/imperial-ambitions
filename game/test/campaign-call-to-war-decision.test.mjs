import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,loadGame,saveGame} from '../engine.mjs';import {campaignCallToWarDecision} from '../campaign-call-to-war-decision.mjs';
test('live call evaluation uses recorded economy forecasts without mutating saved state',()=>{
 const s=loadGame(saveGame(createGame({transportModel:'ports'}))),before=JSON.stringify(s);
 const r=campaignCallToWarDecision(s,'france','england','sweden',{defensive:true});
 assert.ok(Number.isFinite(r.score));assert.equal(JSON.stringify(s),before);assert.ok(r.declareWar||r.breakAlliance);
 s.wars=[['france','sweden']];const joined=campaignCallToWarDecision(s,'france','england','sweden',{defensive:true});assert.equal(joined.alreadyAtWar,true);assert.equal(joined.declareWar,null);
});
test('offensive calls use the original ally border predicate and opposing allies contribute their forecasts',()=>{
 const s=createGame({transportModel:'ports'});s.provinces.push({id:'a',owner:'france',old:false},{id:'b',owner:'england',old:false});s.tiles=[{id:'0,0',x:0,y:0,province:'a'},{id:'1,0',x:1,y:0,province:'b'}];
 s.alliances=[['sweden','holland']];
 const strengths=Object.fromEntries(Object.keys(s.nations).map(id=>[id,{border:10,nonborder:20}]));
 const off=campaignCallToWarDecision(s,'france','england','sweden',{defensive:false,strengths});assert.equal(off.branch,'border');assert.deepEqual(off.military.allies,[10]);
 const def=campaignCallToWarDecision(s,'france','england','sweden',{defensive:true,strengths});assert.equal(def.branch,'nonborder');assert.deepEqual(def.military.allies,[20]);
 assert.throws(()=>campaignCallToWarDecision(s,'france','england','sweden',{defensive:true,strengths:{}}),/Verified/);
});
