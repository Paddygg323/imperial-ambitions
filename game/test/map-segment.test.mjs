import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {originalSeaSegment} from '../map-seapoints.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-segment.json',import.meta.url)));
test('segment geometry matches all23 initialized bytes in309 native constructions',()=>{
 assert.equal(audit.cases.length,309);
 for(const [i,c] of audit.cases.entries())assert.equal(Buffer.from(originalSeaSegment(c.first,c.second)).toString('hex'),c.hex,`case ${i}`);
});
