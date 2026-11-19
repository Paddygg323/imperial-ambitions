import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIPS} from '../rules.mjs';
import {chooseFlagship,refreshNavalLeadership} from '../naval-leader.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-leader-audit.json',import.meta.url),'utf8'));
test('flagship choice matches 867 native comparisons including admiral and exact ties',()=>{
 assert.equal(audit.cases.length,867);
 for(const c of audit.cases){
  const ships=c.pair.map((s,id)=>({...s,id,type:Object.keys(SHIPS).find(k=>SHIPS[k].nativeId===s.nativeId)}));
  assert.equal(chooseFlagship([ships[1],ships[0]]).id,c.winner,JSON.stringify(c));
 }
});
test('sinking flagship replaces leadership with surviving admiral rather than retaining bonus',()=>{
 const first={id:'first',type:'galleon',hp:50,admiralExperience:410},second={id:'second',type:'sloop',hp:25,admiralExperience:120};
 const b={sides:[[first,second],[]]};refreshNavalLeadership(b);assert.deepEqual(b.admirals,[4,0]);
 b.sides[0]=[second];refreshNavalLeadership(b);assert.deepEqual(b.flagships,['second',null]);assert.deepEqual(b.admirals,[1,0]);
});
