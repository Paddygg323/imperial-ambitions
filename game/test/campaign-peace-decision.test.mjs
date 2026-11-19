import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {campaignPeaceDecision} from '../campaign-peace-decision.mjs';
import {peaceThreat} from '../peace-threat.mjs';

function fixture(){
 const s=createGame({transportModel:'ports'});
 s.wars=[['france','england']];
 const strengths=Object.fromEntries(Object.keys(s.nations).map(id=>[id,{border:10,nonborder:20}]));
 strengths.england={border:30,nonborder:60};
 return {s,strengths};
}
test('peace adapter selects actual shared borders, includes overseas borders, and never changes state',()=>{
 const {s,strengths}=fixture(),before=JSON.stringify(s);
 const result=campaignPeaceDecision(s,'france','england',{strengths});
 assert.equal(result.branch,'nonborder');assert.equal(result.input.own,20);assert.equal(result.input.opponent,60);
 assert.equal(result.threat,3);assert.equal(JSON.stringify(s),before);
 // Two synthetic overseas provinces isolate the original adjacency predicate.
 s.provinces.push({id:'border-a',owner:'france',old:false},{id:'border-b',owner:'england',old:false});
 s.tiles=[{id:'0,0',x:0,y:0,province:'border-a'},{id:'1,0',x:1,y:0,province:'border-b'}];
 const adjacent=campaignPeaceDecision(s,'france','england',{strengths});
 assert.equal(adjacent.branch,'border');assert.equal(adjacent.input.own,10);assert.equal(adjacent.input.opponent,30);
});
test('other active Great Power wars contribute in original nation order; minors and eliminated powers do not',()=>{
 const {s,strengths}=fixture();s.wars.push(['france','spain'],['france','sweden'],['england','holland'],['france','scotland']);
 strengths.sweden.nonborder=12;strengths.spain.nonborder=16;strengths.holland.nonborder=8;
 const result=campaignPeaceDecision(s,'france','england',{strengths});
 assert.deepEqual(result.input.ownOtherEnemies,[12,16]);assert.deepEqual(result.input.opponentOtherEnemies,[8]);
 assert.equal(result.threat,peaceThreat(result.input));
 s.nations.sweden.alive=false;delete strengths.sweden;
 assert.deepEqual(campaignPeaceDecision(s,'france','england',{strengths}).input.ownOtherEnemies,[16]);
});
test('saved minister, war support and allies influence the native acceptance thresholds',()=>{
 const {s,strengths}=fixture();s.nations.france.ministers={foreign:0,defence:0};s.nations.france.warSupport=1;
 strengths.england.nonborder=28;s.alliances=[['france','portugal']];s.wars.push(['portugal','england']);strengths.portugal.nonborder=0;
 assert.equal(campaignPeaceDecision(s,'france','england',{strengths}).accepted,false);
 strengths.england.nonborder=60;
 assert.deepEqual(campaignPeaceDecision(s,'france','england',{strengths}).brokenAlliances,['portugal']);
 strengths.england.nonborder=20;s.nations.france.warSupport=.2;
 assert.equal(campaignPeaceDecision(s,'france','england',{strengths}).accepted,true);
});
test('missing live forecast inputs are rejected instead of guessed; peace is already satisfied outside war',()=>{
 const {s,strengths}=fixture();assert.throws(()=>campaignPeaceDecision(s,'france','england',{strengths:{}}),/Verified strategic/);
 delete s.nations.france.ministers;assert.throws(()=>campaignPeaceDecision(s,'france','england',{strengths}),/Recorded peace/);
 s.wars=[];assert.deepEqual(campaignPeaceDecision(s,'france','england'),{accepted:true,brokenAlliances:[],atWar:false});
});

test('saved human food and materials drive the peace strength forecast without changing orders',()=>{
 let {s}=fixture();Object.assign(s.nations.england.stock,{grain:60,fish:60,meat:60,fabric:10,bronze:40,steel:100,lumber:100});
 s=loadGame(saveGame(s));const before=JSON.stringify(s);
 const supplied=campaignPeaceDecision(s,'france','england');
 assert.equal(JSON.stringify(s),before);
 Object.assign(s.nations.england.stock,{grain:0,fish:0,meat:0});
 const empty=campaignPeaceDecision(s,'france','england');
 assert.ok(supplied.input.opponent>empty.input.opponent,'Food-supported reinforcement potential affects strength even with unchanged regiments');
 assert.equal(supplied.input.own,empty.input.own);
 delete s.nations.england.interiorPlanning;s=loadGame(saveGame(s));
 assert.deepEqual(campaignPeaceDecision(s,'france','england'),empty,'Missing old human initialization restores the same initial forecast without changing orders');
});

test('automatic peace forecast refuses the legacy quota model rather than mixing transport systems',()=>{
 const s=createGame();s.wars=[['france','england']];
 assert.throws(()=>campaignPeaceDecision(s,'france','england'),/port transport/);
});
