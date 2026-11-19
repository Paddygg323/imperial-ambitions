import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assignMerchantEscorts} from '../merchant-escorts.mjs';
const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-merchant-escorts-audit.json',import.meta.url),'utf8'));
test('shipment escort assignments and random consumption match native fraction and boundary cases',()=>{
 assert.equal(audit.cases.length,110);
 for(const c of audit.cases){const ships=c.rolls.map((_,id)=>({id})),draws=[];
  const result=assignMerchantEscorts(ships,c.quantity,c.total,()=>{const r=c.rolls[draws.length];draws.push(r);return r;});
  assert.deepEqual({threshold:result.threshold,selected:result.selected.map(s=>s.id),draws},{threshold:c.threshold,selected:c.selected,draws:c.draws},JSON.stringify(c));
  assert.deepEqual(ships,c.rolls.map((_,id)=>({id})));for(const s of result.selected)assert.equal(s,ships[s.id]);
 }
});

test('shipment escorts use unassigned owned home ships of every type without mutating orders',async()=>{
 const {eligibleMerchantEscorts,selectShipmentEscorts}=await import('../merchant-escorts.mjs');
 const {SHIPS}=await import('../rules.mjs');
 const ships=Object.entries(SHIPS).map(([type,d])=>({id:type,type,owner:'england',location:'home',hp:d.hull,order:null}));
 const base=ships[0];ships.push({...base,id:'away',location:'sea0'},{...base,id:'anchor',location:'port:1,1'},{...base,id:'foreign',owner:'portugal'},{...base,id:'departing',order:{job:'sail'}},{...base,id:'sunk',hp:0});
 const state={nations:{england:{alive:true},portugal:{alive:true}},ships},before=structuredClone(state);
 const eligible=eligibleMerchantEscorts(state,'england');assert.deepEqual(eligible.map(s=>s.type),Object.keys(SHIPS));
 let draws=0;const assigned=selectShipmentEscorts(state,'england',10,10,()=>{draws++;return 0;});
 assert.equal(draws,Object.keys(SHIPS).length);assert.deepEqual(assigned.selected,eligible);assert.deepEqual(state,before);
 state.nations.england.alive=false;assert.deepEqual(eligibleMerchantEscorts(state,'england'),[]);
});
