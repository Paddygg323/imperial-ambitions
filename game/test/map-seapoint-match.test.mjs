import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {matchOriginalSeaPoints,originalSeaSegment} from '../map-seapoints.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-seapoint-match.json',import.meta.url)));
test('sea-boundary matching and consumed records match120 native executions',()=>{
 assert.equal(audit.cases.length,120);
 for(const [i,c] of audit.cases.entries()){
  const points=structuredClone(c.points);
  const pairs=matchOriginalSeaPoints(points);
  assert.deepEqual(pairs,c.pairs,`pairs ${i}`);
  assert.deepEqual(pairs.map(([a,b])=>Buffer.from(originalSeaSegment(a,b)).toString('hex')),c.segments,`geometry ${i}`);
  assert.deepEqual(points,c.result,`mutations ${i}`);
 }
});
