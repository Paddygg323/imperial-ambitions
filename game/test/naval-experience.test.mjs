import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {navalExperience} from '../naval-experience.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-experience-audit.json',import.meta.url),'utf8'));
test('naval ship and admiral experience match 72 native award cases',()=>{
 assert.equal(audit.cases.length,72);
 for(const c of audit.cases){
  const sides=c.remaining.map(n=>Array.from({length:n},()=>({experience:c.xp}))),original=structuredClone(sides);
  const got=navalExperience(sides,c.initial,c.winner,[c.admiral,c.admiral]);
  assert.deepEqual(got.sides.map(s=>s.map(u=>u.experience)),c.ships);assert.deepEqual(got.admiralExperience,c.admirals);assert.deepEqual(sides,original);
 }
});
test('draws and absent admirals receive no invented experience',()=>{
 const sides=[[{experience:10}],[{experience:20}]];
 assert.deepEqual(navalExperience(sides,[1,1],null).sides,sides);
 assert.deepEqual(navalExperience(sides,[1,1],0).admiralExperience,[null,null]);
});
