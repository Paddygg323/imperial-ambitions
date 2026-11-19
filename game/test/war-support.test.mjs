import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {warSupportEvent,periodicWarSupport} from '../war-support.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-war-support-audit.json',import.meta.url)));
test('war-support events match540 native executions including invalid-event no-ops and clamp boundaries',()=>{
 assert.equal(audit.fpuControlWord,575);assert.equal(audit.cases.length,540);
 for(const c of audit.cases)assert.equal(warSupportEvent(c.before,c.defence,c.event),c.after,JSON.stringify(c));
});
test('periodic war-support updates match50 actual native Great Power war queries',()=>{
 assert.equal(audit.periodic.length,50);
 for(const c of audit.periodic)assert.equal(periodicWarSupport(.5,c.defence,{atWarWithGreatPower:c.enemy>=0&&c.enemy<6&&c.enemy!==c.inactive}),c.after,JSON.stringify(c));
});
test('war support wears down gradually, recovers during peace, and stays positive',()=>{
 let support=1;for(let i=0;i<100;i++)support=periodicWarSupport(support,0,{atWarWithGreatPower:true});
 assert.equal(support,Math.fround(.0001));
 for(let i=0;i<100;i++)support=periodicWarSupport(support,0);assert.equal(support,1);
 assert.throws(()=>warSupportEvent(NaN,0,0));assert.throws(()=>warSupportEvent(1,5,0));
});

test('naval war-support gating matches eight native dispatch captures',async()=>{
 const {recordNavalWarSupport}=await import('../war-support.mjs');
 const data=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-war-support-audit.json',import.meta.url)));
 for(const c of data.cases){
  const state={nations:{a:{ministers:{defence:0},warSupport:.5},b:{ministers:{defence:1},warSupport:.5}}};
  recordNavalWarSupport(state,{winner:c.winner,sides:c.eliminated.map(x=>x?[]:[{}]),nations:[{id:'a'},{id:'b'}]});
  assert.deepEqual(Object.values(state.nations).map(n=>n.warSupport),c.support);
 }
});
test('real saved turns apply one periodic update, only living Great Power wars drain support',async()=>{
 const {createGame,saveGame,loadGame,finishTurnEconomy}=await import('../engine.mjs');
 let s=createGame();s.nations.france.warSupport=.5;s.wars=[['france','england']];
 s=finishTurnEconomy({...loadGame(saveGame(s)),turnPhase:'combat'});
 assert.equal(s.nations.france.warSupport,periodicWarSupport(.5,1,{atWarWithGreatPower:true}));
 const previous=s.nations.france.warSupport;s.wars=[['france','switzerland']];
 s=finishTurnEconomy({...loadGame(saveGame(s)),turnPhase:'combat'});
 assert.equal(s.nations.france.warSupport,periodicWarSupport(previous,1));
 const old=structuredClone(s);delete old.nations.france.ministers;delete old.nations.france.warSupport;
 assert.doesNotThrow(()=>loadGame(saveGame(old)));
 s.nations.france.warSupport=2;assert.throws(()=>saveGame(s),/war support/);
});

test('shipment support affects only the carrier on cancellation or loss, matching20 native captures',async()=>{
 const {recordShipmentWarSupport}=await import('../war-support.mjs');
 const data=JSON.parse(readFileSync(new URL('../../outputs/Native-merchant-war-support-audit.json',import.meta.url)));
 for(const c of data.cases){
  const s={nations:Object.fromEntries(Array.from({length:5},(_,i)=>[String(i),{ministers:{defence:i},warSupport:.5}]))};
  recordShipmentWarSupport(s,String(c.carrier),c.status);
  assert.deepEqual(Object.values(s.nations).map(n=>n.warSupport),c.support);
 }
});
