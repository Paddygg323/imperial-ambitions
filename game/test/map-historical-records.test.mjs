import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {historicalGenerationRecords} from '../map-historical-records.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-historical-records.json',import.meta.url)));
test('historical generator input matches native raster field loops and river construction',()=>{
 const tiles=historicalGenerationRecords();assert.equal(createHash('sha256').update(tiles).digest('hex'),audit.recordsSha256);
 assert.equal(audit.rows.filter(r=>r[1]!==5).length,1161);
 tiles.fill(0);assert.notDeepEqual(historicalGenerationRecords(),tiles,'fresh records per generation');
});
