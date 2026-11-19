import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIPS} from '../rules.mjs';
import {navalFireAtRange} from '../naval-fire.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-fire-audit.json',import.meta.url),'utf8'));
test('naval fire, firing count and health match 870 unmodified executable cases',()=>{
 assert.equal(audit.cases.length,870);
 for(const c of audit.cases){
  const ships=c.ships.map(s=>({...s,type:Object.keys(SHIPS).find(k=>SHIPS[k].nativeId===s.nativeId)}));
  assert.deepEqual(navalFireAtRange(ships,c.distance),{firepower:c.firepower,firing:c.firing,health:c.health},JSON.stringify(c));
 }
});
test('naval range extensions round each ship independently and damage remains a separate factor',()=>{
 const carrack={type:'carrack',hp:25,experience:0},galleon={type:'galleon',hp:50,experience:0};
 assert.equal(navalFireAtRange([carrack,carrack,carrack],2).firepower,0);
 assert.equal(navalFireAtRange([galleon],3).firepower,2);
 assert.equal(navalFireAtRange([galleon],4).firepower,1);
 assert.equal(navalFireAtRange([galleon],5).firepower,0);
 const damaged=navalFireAtRange([{...galleon,hp:1}],2);
 assert.equal(damaged.firepower,7);assert.equal(damaged.health,Math.fround(1/50));
 assert.throws(()=>navalFireAtRange([{...galleon,hp:0}],4),/living/);
});
