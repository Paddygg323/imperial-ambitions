import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {cityNeeds} from '../city-needs.mjs';
test('city food, luxury needs and deductions match400 original executions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-city-needs-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,400);
 for(const c of audit.cases)assert.deepEqual(cityNeeds(c),c.result,JSON.stringify(c));
});

test('new-city initializer gives independent zero deductions, not existing warehouse stock',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-city-needs-initialization-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,100);
 for(const c of audit.cases){
  assert.deepEqual(c.initial,Array(28).fill(0));
  assert.deepEqual(c.deductions,Array(28).fill(0));
  assert.deepEqual(cityNeeds(c),c.result);
  const mouths=Math.max(0,c.population-(c.foraging?c.foragingProvinces:0));
  assert.equal(c.result[20]+c.result[22],mouths);
  assert.deepEqual(c.result.slice(17,20),c.workers.slice(1));
  assert.ok(c.stock.some(v=>v>0));
 }
});
