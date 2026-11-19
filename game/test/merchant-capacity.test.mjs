import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {homeCargo} from '../economy.mjs';import {SHIPS} from '../rules.mjs';
test('campaign home cargo matches248 original merchant-capacity cases',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-merchant-capacity-audit.json',import.meta.url)));
 const byNative=Object.fromEntries(Object.values(SHIPS).map(s=>[s.nativeId,s]));
 assert.equal(audit.cases.length,248);
 for(const c of audit.cases){
  // Native absent/0/7 missions are eligible for home merchant duty. Other
  // missions are represented by an outstanding fleet order in the rebuild.
  const ships=c.ships.map(s=>({owner:s.owner,location:s.location===c.home?'home':'away',cargo:byNative[s.nativeId].cargo,order:[null,0,7].includes(s.mission)?null:{job:'sail'}}));
  assert.equal(homeCargo({ships},c.owner),c.result,JSON.stringify(c));
 }
});
