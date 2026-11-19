import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {countryDelivery} from '../country-delivery.mjs';
test('country delivery matches200 original runs with home deduction event, material debt and riches receipts',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-country-delivery-audit.json',import.meta.url)));
 assert.equal(audit.cases.length,200);
 for(const [i,c] of audit.cases.entries()){
  const before=structuredClone(c);assert.deepEqual(countryDelivery(c),c.result,'native case '+i);assert.deepEqual(c,before);
 }
});
test('original transport-disaster dispatch reduces only affected nation home ordinary goods',()=>{
 const audit=JSON.parse(readFileSync(new URL('../../outputs/Native-transport-disaster-audit.json',import.meta.url)));
 assert.equal(audit.detail,3);assert.equal(audit.cases.length,12);
 const input={home:0,stock:Array(28).fill(0),outstanding:Array(28).fill(0),prices:[11,23,47,89,131],income:[0,0,0,0,0],cash:1000,
 records:[{root:0,flag:0,automatic:true,potential:Array(28).fill(2),assigned:Array(28).fill(0)},{root:1,flag:0,automatic:false,potential:Array(28).fill(8),assigned:Array(28).fill(3)}]};
 for(const c of audit.cases){
  const currentEvents=c.events;
  const result=countryDelivery({...input,nation:c.nation,currentEvents});
  assert.deepEqual(result.stock.slice(0,23),Array(23).fill(c.present?4:5));
  assert.deepEqual(result.income,input.prices.map(price=>price*5));
  const other=countryDelivery({...input,nation:(c.nation+1)%6,currentEvents});
  assert.deepEqual(other.stock.slice(0,23),Array(23).fill(5));
  const seaOnly=countryDelivery({...input,records:input.records.slice(1),nation:c.nation,currentEvents});
  assert.deepEqual(seaOnly.stock.slice(0,23),Array(23).fill(3));
 }
});
