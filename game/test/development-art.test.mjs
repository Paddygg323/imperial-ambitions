import test from 'node:test';
import assert from 'node:assert/strict';
import {developmentSprite} from '../development-art.mjs';
test('visual development follows actual level and resource, without showing undiscovered mines',()=>{
 for(const level of [0,1,2,3,4]){
  assert.equal(developmentSprite({level},null),null);
  for(const [resource,row] of [['grain',0],['sugarCane',0],['horses',1],['timber',2],['iron',3]]){
   assert.deepEqual(developmentSprite({level},resource),level?{...(resource==='sugarCane'?{sheet:'overseas'}:{}),row,column:level-1}:null);
  }
 }
 assert.equal(developmentSprite({level:4},'fish'),null);
});
