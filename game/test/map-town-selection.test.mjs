import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {selectOriginalTownSite} from '../map-town-selection.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-map-town-selection.json',import.meta.url)));
test('town selection matches200 native selections and RNG states',()=>{
 assert.equal(audit.cases.length,200);
 for(const c of audit.cases){
  const tiles=new Uint8Array(6480*40);c.ids.forEach((i,j)=>tiles[i*40]=c.terrain[j]);
  const state={tiles,randomState:c.seed};assert.equal(selectOriginalTownSite(state,c.ids,c.interior),c.town);assert.equal(state.randomState,c.randomState);
 }
});
