import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planningFoodNeeds} from '../planning-food.mjs';
import {population} from '../economy.mjs';
test('live population and planning food match244 original city/country executions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-planning-food-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,244);
 for(const c of audit.cases){
  const s={nations:{england:{workers:Array(c.workerCounts.reduce((a,b)=>a+b,0)).fill({})}},armies:Array.from({length:c.armyCount},()=>({owner:'england'})),ships:c.shipOwners.map(owner=>({owner:owner===0?'england':'france'}))};
  assert.equal(population(s,'england'),c.population,JSON.stringify(c));
  assert.equal(c.provinceCategories.filter(category=>category<12).length,c.oldWorld);
  assert.deepEqual(planningFoodNeeds({population:c.population,oldWorldProvinces:c.oldWorld,foraging:c.foraging}),c.needs,JSON.stringify(c));
 }
});
