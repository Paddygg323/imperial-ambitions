import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {adjacentZone,zoneAdjacencyAllowed} from '../map-zone-adjacency.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-zone-adjacency.json',import.meta.url)));
test('coarse-grid neighbors match all4860 original wrap and non-wrap results',()=>{
 for(const c of audit.neighbors)for(let i=0;i<405;i++)for(let d=0;d<6;d++)assert.equal(adjacentZone(i,d,c.noWrap),c.results[i][d]);
});
test('land-group placement checks match320 native results and all mutated group state',()=>{
 assert.equal(audit.cases.length,320);
 for(const [i,c] of audit.cases.entries()){
  const state=structuredClone(c.before);
  assert.equal(zoneAdjacencyAllowed(state,c.index,c.country,c.noWrap),c.accepted,`case ${i}`);
  assert.deepEqual(state,c.after,`state ${i}`);
 }
});
