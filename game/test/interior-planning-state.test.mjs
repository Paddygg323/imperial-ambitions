import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createGame,saveGame,loadGame,beginTurn} from '../engine.mjs';
import {initialInteriorPlanning} from '../interior-planning-state.mjs';
import {campaignReinforcementForecast} from '../campaign-reinforcement-forecast.mjs';
test('human minister initialization permits a read-only strategic forecast without assigning civilian orders',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-human-minister-initialization-audit.json',import.meta.url)));
 assert.deepEqual(audit.cases.map(c=>c.interiorAllocated),[false,true]);
 assert.deepEqual(audit.cases[1].allocations,[0x84,0x3610,0xb8]);
 for(const player of ['england','portugal']){
  const s=loadGame(saveGame(createGame({player,transportModel:'ports'}))),before=JSON.stringify(s);
  const forecast=campaignReinforcementForecast(s,player);
  assert.deepEqual(forecast.input.undeveloped,[0,0]);assert.deepEqual(forecast.input.unused,[0,0]);
  assert.ok(Number.isFinite(forecast.strength.border));assert.ok(Number.isFinite(forecast.strength.nonborder));
  assert.equal(JSON.stringify(s),before);
 }
});
test('AI planning starts from original zeroed arrays and persists distinct history',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-interior-planning-initialization-audit.json',import.meta.url)));
 for(const c of audit.cases)assert.deepEqual(initialInteriorPlanning(),c.result);
 let s=createGame();assert.deepEqual(s.nations.france.interiorPlanning,initialInteriorPlanning());assert.deepEqual(s.nations.england.interiorPlanning,initialInteriorPlanning());
 s.nations.france.interiorPlanning.unused[20]=3;s.nations.france.interiorPlanning.undeveloped[20]=5;
 s=loadGame(saveGame(s));assert.equal(s.nations.france.interiorPlanning.unused[20],3);assert.equal(s.nations.spain.interiorPlanning.unused[20],0);
 assert.equal(campaignReinforcementForecast(s,'france').input.unused[0],3);
 delete s.nations.france.interiorPlanning;s=loadGame(saveGame(s));assert.throws(()=>campaignReinforcementForecast(s,'france'),/planning/);
});
test('malformed saved planning history is rejected',()=>{
 for(const value of [null,{unused:[0]}, {...initialInteriorPlanning(),tiles:Array(28).fill(32768)}]){
  const s=createGame();s.nations.france.interiorPlanning=value;assert.throws(()=>saveGame(s),/interior planning/);
 }
});

test('older human saves restore native initial planning before an AI declaration invokes peace forecasts',()=>{
 let s=createGame({transportModel:'ports'});delete s.nations.england.interiorPlanning;
 s.declarations=[{nation:'sweden',target:'england'}];
 s=loadGame(saveGame(s));assert.deepEqual(s.nations.england.interiorPlanning,initialInteriorPlanning());
 const snapshot=saveGame(s),next=beginTurn(s);assert.equal(saveGame(s),snapshot);
 assert.ok(next.wars.some(w=>w.includes('sweden')&&w.includes('england')));
 const saved=loadGame(saveGame(next));assert.deepEqual(saved.nations.england.interiorPlanning,initialInteriorPlanning());
 saved.nations.england.interiorPlanning.unused[20]=7;
 assert.equal(loadGame(saveGame(saved)).nations.england.interiorPlanning.unused[20],7);
});
