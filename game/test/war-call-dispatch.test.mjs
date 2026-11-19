import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {queueDeclarationCalls} from '../war-call-phase.mjs';import {NATIONS} from '../rules.mjs';
test('call queue matches768 original declaration alliance scans',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-war-call-dispatch-audit.json',import.meta.url),'utf8')),ids=NATIONS.map(([id])=>id);
 for(const c of audit.cases){
  const s={turn:1,nations:Object.fromEntries(ids.map(id=>[id,{alive:true}])),alliances:c.alliances.map(p=>p.map(i=>ids[i])),wars:c.wars.map(p=>p.map(i=>ids[i]))};
  queueDeclarationCalls(s,ids[0],ids[1]);
  assert.deepEqual(s.pendingWarCalls??[],c.calls.map(x=>({recipient:ids[x.recipient],ally:ids[x.flag?x.second:x.first],enemy:ids[x.flag?x.first:x.second],defensive:x.flag===0,turn:1})));
 }
});
