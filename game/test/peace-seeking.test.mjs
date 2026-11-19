import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {shouldSeekPeace} from '../peace-seeking.mjs';
test('AI peace seeking matches1152 complete native country scans including human timing and declaration date',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-peace-seeking-audit.json',import.meta.url)));
 for(const c of audit.cases){
  const offers=[];
  for(let target=0;target<6;target++)if(shouldSeekPeace({...c,target,active:c.active.includes(target),war:c.own!==target,declaredThisTurn:c.sameTurn}))offers.push([target,0x130]);
  assert.deepEqual(offers,c.offers,JSON.stringify(c));
 }
});
test('peace seeking rejects unknown time and candidate state rather than guessing',()=>{
 const c={own:0,target:1,turn:0,human:true,active:true,war:true,declaredThisTurn:false,threat:2,factor:1,seek:1};
 assert.equal(shouldSeekPeace(c),true);assert.equal(shouldSeekPeace({...c,war:false}),false);
 assert.throws(()=>shouldSeekPeace({...c,declaredThisTurn:undefined}),/Invalid/);assert.throws(()=>shouldSeekPeace({...c,turn:NaN}),/Invalid/);
});
