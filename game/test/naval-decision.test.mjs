import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIPS} from '../rules.mjs';
import {navalDecision} from '../naval-decision.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-decision-audit.json',import.meta.url),'utf8'));
test('range preference, retreat and movement intent match 462 native decisions',()=>{
 assert.equal(audit.cases.length,462);
 for(const c of audit.cases){
  const sides=c.sides.map(ships=>ships.map(s=>({...s,type:Object.keys(SHIPS).find(k=>SHIPS[k].nativeId===s.nativeId)})));
  assert.deepEqual(navalDecision(sides,c.aggression,c.distance,c.admirals),{preferred:c.preferred,retreat:c.retreat,direction:c.direction},JSON.stringify(c));
 }
});
