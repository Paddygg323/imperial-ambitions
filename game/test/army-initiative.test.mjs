import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARMY} from '../rules.mjs';
import {armyInitiative} from '../army-initiative.mjs';
const native=JSON.parse(readFileSync(new URL('./native-army-initiative.json',import.meta.url)));
test('army initiative matches 222 original executions including mixed arms and generals',()=>{
 for(const c of native.cases){
  const units=c.ids.map(id=>({type:Object.keys(ARMY).find(k=>ARMY[k].nativeId===id),experience:400}));
  assert.deepEqual(armyInitiative(units,c.roll,{friendly:c.mode==='friendly',adjacent:c.mode!=='sea'}),{base:c.base,score:c.score},JSON.stringify(c));
 }
});
