import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {translateOriginalZones} from '../map-zone-tiles.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-zone-translation.json',import.meta.url)));
test('coarse-to-tile expansion matches24 whole original translations across all6480 cells',()=>{
 assert.equal(audit.cases.length,24);
 for(const [i,c] of audit.cases.entries())assert.deepEqual(translateOriginalZones(c.owners,c.groups),c.result,`case ${i}`);
});
