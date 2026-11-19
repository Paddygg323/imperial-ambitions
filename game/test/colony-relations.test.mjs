import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inheritColonyRelations} from '../colony-relations.mjs';
test('colony relationship inheritance matches 54 original executions',()=>{
 const {cases}=JSON.parse(readFileSync(new URL('../../outputs/Native-colony-relations-audit.json',import.meta.url),'utf8'));
 assert.equal(cases.length,54);
 for(const c of cases){
  assert.deepEqual(inheritColonyRelations(c.matrix,c.colony,c.parent),c.result);
  assert.equal(c.result[c.parent][c.colony],255);
  assert.equal(c.result[c.colony][c.parent],255);
 }
});
