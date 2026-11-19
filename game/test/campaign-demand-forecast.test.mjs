import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,saveGame,loadGame} from '../engine.mjs';
import {campaignDemandForecast} from '../campaign-demand-forecast.mjs';
import {demandForecast} from '../demand-forecast.mjs';
test('complete campaign forecast composes audited arithmetic and two ordered city queries',()=>{
 const s=createGame(),planning={unused:Array(28).fill(0),undeveloped:Array(28).fill(0)};
 s.nations.england.cityForecast.needs[13]=9;s.nations.england.cityForecast.deductions[13]=2;
 const before=structuredClone(s),r=campaignDemandForecast(s,'england',{seed:123,planning});
 assert.equal(r.opening.input.needs[13],7);assert.equal(r.capacity.needs[13],5);
 assert.deepEqual(r.demand,demandForecast({...r.opening.input,...r.limits.input,
  workers:['peasant','apprentice','journeyman','master'].map(type=>s.nations.england.workers.filter(w=>w.type===type).length),gdp:s.nations.england.gdp,populationLimit:r.reinforcement.recruitmentLimit}));
 before.nations.england.cityForecast=structuredClone(s.nations.england.cityForecast);assert.deepEqual(s,before);
 assert.deepEqual(loadGame(saveGame(s)).nations.england.cityForecast,s.nations.england.cityForecast);
});
test('incomplete campaign forecast inputs leave state unchanged',()=>{
 const s=createGame();delete s.nations.england.interiorPlanning;delete s.preferenceSeed;const before=JSON.stringify(s),planning={unused:Array(28).fill(0),undeveloped:Array(28).fill(0)};
 assert.throws(()=>campaignDemandForecast(s,'england',{planning}),/seed/);assert.equal(JSON.stringify(s),before);
 assert.throws(()=>campaignDemandForecast(s,'england',{seed:123}),/planning/);assert.equal(JSON.stringify(s),before);
});
