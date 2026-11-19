import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {populationNeeds} from '../population-needs.mjs';
test('population demand refresh matches400 original calls in100 changing sequences',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-population-needs-audit.json',import.meta.url)));
 assert.equal(audit.sequences.length,100);
 for(const steps of audit.sequences){
  assert.equal(steps.length,4);let previous;
  for(const c of steps){
   if(previous)assert.deepEqual(c.initial,previous);
   assert.deepEqual(populationNeeds(c),c.result);
   for(let i=0;i<28;i++)if(![17,18,19,20,22].includes(i))assert.equal(c.result[i],c.initial[i]);
   previous=c.result;
  }
 }
});
