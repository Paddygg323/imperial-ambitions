import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {warSupportEvent} from '../war-support.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-territorial-war-support-audit.json',import.meta.url)));
// Deliberately source evidence only: preceding eligibility and relationship
// semantics must be audited before these callbacks are wired to conquest.
test('96 native territorial callbacks preserve winner, loser and independent third-party gates',()=>{
 assert.equal(audit.cases.length,96);
 for(const c of audit.cases){
  const expected=[];
  for(let i=0;i<6;i++){
   if(i===c.excluded)continue;
   if(i===c.attacker)expected.push([i,2]);
   if(i===c.defender){expected.push([i,3]);continue;}
   if(c.defender<6){
    if(c.treaty===2)expected.push([i,5]);
    if(c.query5231e0)expected.push([i,5]);
   }
  }
  assert.deepEqual(c.events,expected,JSON.stringify(c));
  const support=Array(6).fill(.5);
  for(const [nation,event] of c.events)support[nation]=warSupportEvent(support[nation],nation%5,event);
  assert.deepEqual(support,c.support,JSON.stringify(c));
 }
});

test('real native control, treaty and declaration-turn queries match144 territorial cases',async()=>{
 const {territorialWarSupportEvents}=await import('../territorial-war-support.mjs');
 const data=JSON.parse(readFileSync(new URL('../../outputs/Native-territorial-relations-support-audit.json',import.meta.url)));
 assert.equal(data.cases.length,144);
 for(const c of data.cases){
  const events=territorialWarSupportEvents({...c,computerPowers:[0,1,2,3,4,5].filter(i=>i!==c.human),treatyStatus:()=>c.treaty,declaredTurn:()=>c.declared});
  const support=Array(6).fill(.5);
  for(const [nation,event] of events)support[nation]=warSupportEvent(support[nation],nation%5,event);
  assert.deepEqual(support,c.support,JSON.stringify(c));
  if(c.human>=0)assert.equal(support[c.human],.5);
 }
});

test('territorial support does not invent missing war age',async()=>{
 const {territorialWarSupportEvents}=await import('../territorial-war-support.mjs');
 assert.throws(()=>territorialWarSupportEvents({attacker:0,defender:1,computerPowers:[0],treatyStatus:()=>6,declaredTurn:()=>undefined,turn:10}),/Missing declaration turn/);
});
