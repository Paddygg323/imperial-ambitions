import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIPS} from '../rules.mjs';
import {createNavalBattle,stepNavalBattle} from '../naval-battle.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-naval-encounter-audit.json',import.meta.url),'utf8'));
test('complete naval encounters match native winner, hull, captures, experience and RNG',()=>{
 assert.equal(audit.cases.length,351);
 for(const c of audit.cases){
  const sides=c.types.map((ids,side)=>ids.map((nativeId,index)=>{const type=Object.keys(SHIPS).find(k=>SHIPS[k].nativeId===nativeId);return {id:`${side}-${index}`,owner:String(side),type,hp:SHIPS[type].hull,experience:0,admiralExperience:index===0?(c.admirals?.[side]??null):null};}));
  let b=createNavalBattle({sides,nations:[{id:'0',known:[]},{id:'1',known:[]}],seed:c.initialSeed});
  while(b.phase==='active')b=stepNavalBattle(JSON.parse(JSON.stringify(b)));
  assert.deepEqual(b.history.map(r=>({preferred:r.preferred,direction:r.direction})),c.decisions.map(r=>({preferred:r.preferred,direction:r.direction})),`Round decisions: ${JSON.stringify({types:c.types,seed:c.initialSeed,admirals:c.admirals})}`);
  assert.deepEqual(b.suppressed,c.suppressed,'Native losing force suppression '+JSON.stringify(c));
  const ships=[...b.sides.flat().map(s=>({...s,fate:'survived'})),...b.captured.map(s=>({...s,fate:'captured'})),...b.sunk.map(s=>({...s,fate:'sunk'}))];
  const actual=c.ships.map(s=>{const got=ships.find(u=>u.id===`${s.side}-${s.index}`);return {side:s.side,index:s.index,hp:got.hp,owner:Number(got.owner),experience:got.experience,admiralExperience:got.admiralExperience??null,fate:got.fate};});
  assert.deepEqual({winner:b.winner,seed:b.seed,ships:actual,distance:b.distance},{winner:c.winner,seed:c.seed,ships:c.ships,distance:c.distance},JSON.stringify(c));
 }
});
