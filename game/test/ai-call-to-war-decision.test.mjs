import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {aiCallToWarDecision} from '../ai-call-to-war-decision.mjs';
const native=JSON.parse(readFileSync(new URL('../../outputs/Native-ai-call-to-war-audit.json',import.meta.url),'utf8'));
test('AI call-to-war decisions and action targets match4000 original executions',()=>{
 for(const c of native.cases){
  const ids=['england','france','sweden'],defensive=c.flag===0;
  const r=aiCallToWarDecision({recipient:ids[0],ally:ids[defensive?1:2],enemy:ids[defensive?2:1],defensive,alreadyAtWar:c.war,...c});
  const action=c.calls.find(x=>['warOrder','breakAlliance'].includes(x.kind));
  assert.equal(c.result,1,'Original success return is not acceptance');
  if(c.war){assert.equal(action,undefined);assert.equal(r.alreadyAtWar,true);assert.equal(r.declareWar,null);assert.equal(r.breakAlliance,null);continue;}
  assert.equal(r.accepted,action.kind==='warOrder',JSON.stringify(c));
  const a=action.args;
  if(r.accepted){assert.equal(r.declareWar.target,ids[a[0]]);assert.equal(r.declareWar.supporting,ids[a[2]]);}
  else{assert.equal(r.breakAlliance.ally,ids[a[1]]);assert.equal(r.breakAlliance.reputationPenalty,Boolean(a[2]));}
 }
});
test('AI call-to-war comparison accepts equality and rejects missing strength data',()=>{
 const c={recipient:'england',ally:'france',enemy:'sweden',defensive:true,alreadyAtWar:false,first:.5,second:.5,threshold:1,factor:1};
 assert.equal(aiCallToWarDecision(c).accepted,true);assert.equal(aiCallToWarDecision({...c,second:.49}).accepted,false);
 for(const patch of [{factor:-1},{first:NaN},{second:undefined},{alreadyAtWar:1}])assert.throws(()=>aiCallToWarDecision({...c,...patch}),/Invalid/);
});
import {callToWarThreshold} from '../call-to-war-personality.mjs';
test('call-to-war thresholds match all35 original minister combinations',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-call-to-war-personality-audit.json',import.meta.url),'utf8'));
 for(const c of audit.cases)assert.equal(callToWarThreshold(c.minister204,c.minister20c),c.threshold);
 assert.throws(()=>callToWarThreshold(7,0),/Invalid/);assert.throws(()=>callToWarThreshold(0,-1),/Invalid/);
});

test('zero war support refuses new war but leaves existing participation unchanged',()=>{
 const c={recipient:'england',ally:'france',enemy:'sweden',defensive:true,alreadyAtWar:false,first:100,second:100,threshold:2.4,factor:0};
 assert.equal(aiCallToWarDecision(c).accepted,false);
 assert.equal(aiCallToWarDecision({...c,alreadyAtWar:true}).alreadyAtWar,true);
});
