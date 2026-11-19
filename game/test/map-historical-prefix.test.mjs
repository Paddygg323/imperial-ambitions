import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {generateHistoricalMapAttempt} from '../map-historical-attempt.mjs';import {historicalGenerationRecords} from '../map-historical-records.mjs';
test('historical generation prefix matches chained original stages',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../outputs/Native-historical-prefix.json',import.meta.url))),hash=b=>createHash('sha256').update(b).digest('hex');
 for(const c of fixture.cases){const stages={};const result=generateHistoricalMapAttempt(c.seed,historicalGenerationRecords(),{onStage:(name,s)=>{stages[name]={tilesHash:hash(s.tiles),provincesHash:hash(s.provinces),randomState:s.randomState};}});assert.deepEqual(stages,c.stages,`seed${c.seed}`);if(c.rejected)assert.equal(result.stage,c.rejected);}
});
