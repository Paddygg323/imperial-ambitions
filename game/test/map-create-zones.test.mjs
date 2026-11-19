import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createOriginalZones} from '../map-zone-adjacency.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-create-zones.json',import.meta.url)));
test('complete coarse allocation matches20 original executions including final RNG',()=>{
 assert.equal(audit.cases.length,20);
 for(const c of audit.cases)assert.deepEqual(createOriginalZones(c.seed,c.noWrap,c.beforeGridByte),c.result,JSON.stringify([c.seed,c.noWrap,c.beforeGridByte]));
});
