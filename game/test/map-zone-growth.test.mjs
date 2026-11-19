import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {growOriginalZone} from '../map-zone-adjacency.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-zone-growth.json',import.meta.url)));
test('recursive region growth matches200 original executions, including ownership, grouping and RNG',()=>{
 assert.equal(audit.cases.length,200);
 for(const [i,c] of audit.cases.entries()){
  const state=structuredClone(c.before);
  assert.equal(growOriginalZone(state,c.index,c.requested,c.country,c.direction,c.noWrap),c.count,`count ${i}`);
  assert.deepEqual(state,c.after,`state ${i}`);
 }
});
