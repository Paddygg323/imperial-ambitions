import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {eligiblePlanningTiles} from '../planning-eligibility.mjs';
const audit=JSON.parse(fs.readFileSync(new URL('../../outputs/Native-planning-eligibility-audit.json',import.meta.url)));
test('eligible tiles match36 original full scans including purchased foreign and owned foreign-invested tiles',()=>{
 assert.equal(audit.cases.length,36);for(const c of audit.cases){
  const tiles=c.nodes.map((n,i)=>({id:i,x:i,y:0,owner:n.owner,purchasedBy:n.purchaser})).reverse();
  assert.deepEqual(eligiblePlanningTiles({tiles},c.country).map(t=>t.id),c.selected);
 }
});
