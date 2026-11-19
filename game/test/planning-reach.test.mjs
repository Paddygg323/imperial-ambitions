import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planningReach,planningDistanceThreshold} from '../planning-reach.mjs';
test('planning reach matches960 native paired road/port boundary evaluations',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-planning-reach-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,960);
 for(const c of audit.cases){
  const queries=[];
  assert.deepEqual(planningReach(c,good=>{queries.push(good);return c.limit;}),c.result,JSON.stringify(c));
  assert.deepEqual(queries,[...c.queries.road,...c.queries.port]);
 }
});
test('planning thresholds match700 native resource-priority/GDP evaluations',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-planning-threshold-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,700);
 for(const c of audit.cases)assert.equal(planningDistanceThreshold(c),c.result,JSON.stringify(c));
});
