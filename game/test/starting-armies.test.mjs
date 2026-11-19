import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createGame,saveGame,loadGame,command} from '../engine.mjs';
import {ARMY,NATIONS} from '../rules.mjs';
test('normal capital garrisons match original human and AI regiment-selection executions',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-starting-armies-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,120);
 for(const [player] of NATIONS){
  let s=createGame({player});
  s=loadGame(saveGame(s));
  for(const n of Object.values(s.nations)){
   const army=s.armies.filter(u=>u.owner===n.id),expected=audit.cases.find(c=>c.rawDifficulty===2&&c.human===(n.id===player)&&c.capital);
   assert.deepEqual(army.map(u=>ARMY[u.type].nativeId),expected.regiments.map(r=>r.nativeType));
   assert.ok(army.every(u=>u.hp===100&&u.experience===0&&u.defending&&!u.order&&s.provinces.find(p=>p.id===u.province).town===n.capital));
  }
 }
});
test('starting garrison can redeploy without recruiting or spending materials',()=>{
 const s=createGame(),unit=s.armies.find(u=>u.owner==='england'),target=s.provinces.find(p=>p.owner==='england'&&p.id!==unit.province);
 const next=command(s,'england',{type:'army',units:[unit.id],job:'deploy',province:target.id});
 assert.equal(next.armies.find(u=>u.id===unit.id).defending,false);
 assert.deepEqual(next.nations.england.stock,s.nations.england.stock);
 assert.deepEqual(next.nations.england.workers,s.nations.england.workers);
});
