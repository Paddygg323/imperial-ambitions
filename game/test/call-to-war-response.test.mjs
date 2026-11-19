import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {callToWarResponse} from '../call-to-war-response.mjs';
const native=JSON.parse(readFileSync(new URL('../../outputs/Native-human-call-to-war-audit.json',import.meta.url),'utf8'));
test('human defensive and offensive call responses match original callback targets and penalty flags',()=>{
 for(const c of native.cases){
  const ids=['england','france','sweden'],defensive=c.flag===0,ally=ids[defensive?1:2],enemy=ids[defensive?2:1];
  const result=callToWarResponse({recipient:ids[0],ally,enemy,defensive,accept:c.accept});assert.equal(result.accepted,c.result);
  const nativeAction=c.calls[1],a=nativeAction.args.map(x=>x&0xffff);
  if(c.accept){assert.equal(nativeAction.kind,'warOrder');assert.equal(result.declareWar.target,ids[a[0]]);assert.equal(a[1],2);assert.equal(result.declareWar.supporting,ids[a[2]]);assert.equal(result.breakAlliance,null);}
  else{assert.equal(nativeAction.kind,'breakAlliance');assert.equal(result.breakAlliance.nation,ids[a[0]]);assert.equal(result.breakAlliance.ally,ids[a[1]]);assert.equal(result.breakAlliance.reputationPenalty,Boolean(a[2]));assert.equal(result.declareWar,null);}
 }
});
test('call responses reject ambiguous or self-directed requests',()=>{
 const valid={recipient:'england',ally:'france',enemy:'sweden',defensive:true,accept:true};
 for(const change of [{enemy:'france'},{ally:'england'},{recipient:''},{defensive:1},{accept:undefined}])assert.throws(()=>callToWarResponse({...valid,...change}),/Invalid/);
});
