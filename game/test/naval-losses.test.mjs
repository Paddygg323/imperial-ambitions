import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {navalLosses} from '../naval-losses.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-capture-audit.json',import.meta.url),'utf8'));
test('naval capture eligibility, technology and RNG match 1200 native branches',()=>{
 assert.equal(audit.cases.length,1200);
 for(const c of audit.cases){
  const ship={id:'s',type:'carrack',owner:'england',hp:c.hp,order:{job:'sail'}},draws=[];
  const result=navalLosses([ship],{retreat:c.retreat,captor:{id:'france',known:c.known?['54']:[]}},()=>{draws.push(c.roll);return c.roll;});
  assert.equal(result[c.fate==='survived'?'survivors':c.fate].length,1,JSON.stringify(c));assert.deepEqual(draws,c.draws);
  if(c.fate==='captured'){assert.equal(result.captured[0].hp,1);assert.equal(result.captured[0].owner,'france');assert.equal(result.captured[0].order,null);}
  assert.equal(ship.owner,'england');assert.equal(ship.hp,c.hp);
 }
});
test('cleanup preserves fleet order and keeps prizes out of this battle',()=>{
 const ships=[{id:'live',hp:5,owner:'england'},{id:'prize',hp:0,owner:'england'},{id:'lost',hp:-1,owner:'england'}],rolls=[30,31];
 const r=navalLosses(ships,{retreat:true,captor:{id:'france',known:['54']}},()=>rolls.shift());
 assert.deepEqual(r.survivors.map(s=>s.id),['live']);assert.deepEqual(r.captured.map(s=>s.id),['prize']);assert.deepEqual(r.sunk.map(s=>s.id),['lost']);assert.equal(rolls.length,0);
});
