import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {originalMapSeed,normalizeTerrainMenu} from '../map-generation-primitives.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-generation-primitives.json',import.meta.url)));
test('map seed prefix matches105 original executions, including signed bytes and NUL termination',()=>{
 assert.equal(audit.seeds.length,105);
 for(const c of audit.seeds)assert.deepEqual(originalMapSeed(c.bytes,c.timeSeed),{state:c.state,secondarySeed:c.secondarySeed});
});
test('terrain allocation matches108 original executions, preserving truncation and residual bucket',()=>{
 assert.equal(audit.menus.length,108);
 for(const c of audit.menus)assert.deepEqual(normalizeTerrainMenu(c.tileCount,c.weights),c.result);
});
